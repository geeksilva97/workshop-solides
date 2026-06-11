# Run log - 08-postgres

- **Branch:** `run/08-postgres`
- **Base branch:** `run/07-verificacao`
- **Started:** 2026-06-10 (após o run inicial)

> Re-run com o **banco de verdade**. O run 00-07 usou adapters in-memory + fakes
> determinísticos porque, naquele momento, eu não tinha subido o Postgres. O Edy
> apontou que existe um dump real em `blog/solides/db/` - então esta etapa troca **só
> o adapter** do repositório por um Postgres + pgvector restaurado desse dump. É
> exatamente o port-swap pra que a arquitetura foi desenhada.

## Intenção (o "prompt" da etapa)

> Usar o dump real (`tom-ranks.dump.sql`: 107 empresas com embeddings 1024-dim + `profile_tsv`
> gerado + 2 contas). Restaurar num Postgres+pgvector, implementar `PgCompanyRepository` atrás
> do mesmo port `CompanyRepository` (dense via `<=>`, lexical via `ts_rank_cd`), e rodar o
> pipeline fim-a-fim contra dados reais.

## Decisões

- **Container:** `pgvector/pgvector:pg17` na porta **5433** (pra não colidir com um 5432 local).
  Restore do `tom-ranks.dump.sql` (107 companies, 2 accounts), conferido.
- **`PgCompanyRepository`** (`infra/db/pg-company-repository.ts`) implementa o port:
  - `searchDense`: resolve o embedding da empresa-query e rankeia por cosine (`1 - (embedding <=> q)`).
  - `searchLexical`: termos OR-joined numa `to_tsquery('portuguese', ...)` rankeada por `ts_rank_cd`
    sobre o `profile_tsv` gerado. (BM25-style; o doc do passo 02 já citava o FTS do Postgres.)
  - Mapeia o `kpis` jsonb do dump (`voluntary_turnover`/`absenteeism`/`time_to_hire`/`enps`) pro
    domínio `Kpis`. Sem colunas de porte/região no dump -> porte default + região inferida do
    `(UF)` no profile (retrieval usa embedding+tsv, não esses campos).
- **Seleção do adapter:** `buildServer` usa Postgres quando `DATABASE_URL` está setado, in-memory
  caso contrário. `application` não vê diferença - é o ponto da arquitetura.
- **Teste de integração** (`pg-company-repository.test.ts`) com `{ skip: !DATABASE_URL }` -
  verde com banco (roda de verdade), skipado sem (suíte continua verde em qualquer lugar).

## Bug que o banco real revelou (e o fake escondia)

A rota rodava `runBenchmark(deps, SOLIPSE)` usando a **constante de seed** in-memory, cujo texto
de profile difere da linha real do dump. Resultado contra o Postgres:
- `searchDense` não achava o embedding (profile != seed) -> dense vazia;
- `searchLexical` não conseguia excluir a Solípse real (texto diferente) -> **a Solípse entrava
  no próprio cohort**.

**Fix:** a rota agora carrega a empresa-cliente do repositório (`getById('client-solipse')`),
não de uma constante. Aí o profile/embedding batem com o pool e ela é corretamente excluída.
Fallback pro seed só se o id não existir no repo (modo in-memory). É o tipo de bug que dado
sintético controlado não pega e dado real pega - bom material de palco.

## Arquivos

- `infra/db/pg-company-repository.ts` (+ teste de integração)
- `interface/http/server.ts` (seleção de adapter por `DATABASE_URL`; cliente carregado do repo)
- `interface/http/server.test.ts` (assert tolerante a nome do dump + "não está no próprio cohort")
- `apps/backend/package.json` (+ `pg`, `@types/pg`)
- `db/tom-ranks.dump.sql` + `db/RESTORE.md` (dump real + instruções, copiados pro repo)
- Artefato: `artifacts-08-benchmark-pg.json` (saída real do pipeline contra os 107)

## Verificação

- **In-DB sanity:** dense top-5 da Solípse = SOLIDES TECNOLOGIA (0.687), LOFT, LOGGI, TOTVS, B3 -
  cluster de tech no topo. Lexical (OR) traz tech também.
- **Pipeline fim-a-fim (Postgres):** cohort = 20 empresas reais (SOLIDES no topo), Solípse **fora**
  do próprio cohort, KPIs contra o cohort real: turnover **p100** (bad), absenteísmo **p100** (bad),
  time_to_hire **p30** (ok), eNPS **p0** (bad). Diagnóstico: problema de retenção.
- **Testes:** 23/23 com `DATABASE_URL` (o teste pg roda, ~27ms); 22 pass + 1 skip sem DB.
- Comando do run real: `docker run ... pgvector/pgvector:pg17 -p 5433:5432`, restore do dump,
  `DATABASE_URL=postgresql://tomranks:tomranks@localhost:5433/tomranks`.

> **Nota:** o frontend ainda usa o client de API stubbed (mock), então o dashboard renderizado
> não reflete a corrida do Postgres sem fiar a tela na API real - fora do escopo desta etapa.
> O artefato desta etapa é o JSON do pipeline real (`artifacts-08-benchmark-pg.json`).
