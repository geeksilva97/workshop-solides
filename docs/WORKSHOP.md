# Workshop — Solides Run (ponto de partida)

Esta branch (`workshop/scaffold`) é o **esqueleto** do projeto: toda a estrutura,
os contratos (zod), o frontend, a API, a persistência e os dados de referência
já estão prontos. **Falta o cérebro** — os algoritmos do `@workshop/engine`,
que você (e seu agente) vão implementar.

Os testes já existem e são o **critério de aceite**: começam vermelhos e ficam
verdes conforme você implementa.

## Setup

```bash
docker compose up -d          # PostgreSQL — já sobe com o schema + dados (db/dump.sql)
cp .env.example .env
pnpm install
pnpm dev                      # web :5173 + api :3000
```

Precisa também de [Ollama](https://ollama.com) com os modelos:

```bash
ollama pull qwen3-embedding:0.6b
ollama pull awenleven/Qwen3-Reranker-4B:Q4_K_M
```

> O banco já vem **populado** pelo `db/dump.sql` (schema + 3 empresas-cliente + as
> contas demo) via `docker-entrypoint-initdb.d`. A API também roda migrate/seed
> idempotente no boot, então os dois caminhos convivem.
>
> Conta demo: `ana@solides.com` / `solides123`.

## O worklist

Estado inicial dos testes: `shared` e `web` passam; **`engine` e `api` começam
vermelhos**. Sua missão é implementar as funções marcadas com `TODO` em
`packages/engine/src/` — cada `throw new Error("TODO: ...")` é um passo.

| Passo | Arquivo(s) | Implementar |
|---|---|---|
| run/02 — BM25 | `bm25.ts` | `buildBm25Index`, `searchBm25` |
| run/02 — Dense | `vector.ts` | `cosineSimilarity`, `denseRank` |
| run/03 — RRF | `rrf.ts` | `reciprocalRankFusion` |
| run/04 — Percentis + k-anon | `percentiles.ts` | `quantile`, `percentileOf` |
| run/04 — Indicadores | `indicators.ts` | `buildKpiResult`, `buildCriticalIndicator` |
| run/05–06 — Diagnóstico | `report.ts` | `buildDiagnostic` |

Cada arquivo tem, no cabeçalho, a fórmula/contrato e dicas nos comentários. As
ports (`Embedder`/`Reranker`), os adapters Ollama, os fakes, o corpus e a
orquestração (`pipeline.ts`) **já estão prontos** — você implementa as peças que
eles consomem.

## Loop de trabalho

```bash
pnpm --filter @workshop/engine test     # roda só o engine (rápido, sem banco)
pnpm test                               # tudo; engine + api ficam verdes ao terminar
pnpm typecheck
```

1. Pegue o primeiro `TODO` (BM25).
2. Implemente; rode os testes do engine até ficarem verdes.
3. Siga a tabela de cima pra baixo. Quando o engine inteiro estiver verde, os
   testes de pipeline da **api** também passam (eles rodam o pipeline real sobre
   fakes).
4. Suba o app (`pnpm dev`) e rode um benchmark de ponta a ponta.

## Regras

- `pnpm test` + `pnpm typecheck` verdes **antes de qualquer commit**.
- Não toque nos testes para "passar" — eles são o contrato. Implemente a função.
- As ports existem para testabilidade: a lógica é pura e injeta Ollama/Postgres.
  Mantenha assim.

Para implementar com um agente (Claude Code), veja a seção **"Rodar o workshop
com seu agente"** no `README.md` da branch `main`.
