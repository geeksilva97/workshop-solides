# Etapa 4 - Percentis + k-anonimato

> Live-build. Roteiro §7. O domínio que a IA não adivinha. ~8-10 min.
> Ponto de parada natural pra Q&A.

## Objetivo

Pra cada KPI da Solípse, calcular a distribuição do cohort (p25, p50, p75, p90) e posicionar a
Solípse nela (ex.: "turnover voluntário no p95"). E - o ponto não-negociável - **bloquear** o
cálculo se o cohort for pequeno demais pra preservar privacidade.

## Depende de

- **Cohort** (saída da etapa 3): as ~20 empresas comparáveis, com seus KPIs.

## Onde mexer

| Camada | Arquivo (sugerido) | O quê |
|--------|--------------------|-------|
| `domain` | `domain/cohort.ts` | o **invariante k-anonimato** vive aqui (`Cohort` inválido com < 5) |
| `application` | `application/percentis.ts` | função pura `percentis(kpis, cohort)` |

> **Este é o ponto da arquitetura que o workshop quer provar.** O k-anonimato **não** é um `if`
> solto na função de percentil - é um **invariante do objeto `Cohort`**: um cohort não pode
> sequer existir abaixo do limite. A regra mora no domínio, não na borda. (Ver
> [`domain/README.md`](../../apps/backend/src/domain/README.md).)

## Conceito essencial

Percentil é puro cálculo, sem LLM: ordena os valores daquele KPI no cohort, acha onde a Solípse
cai. Trivial.

O que **não** é trivial e vem de você, não da IA: **dado de RH é dado pessoal.** Se o cohort de
comparação tem 2 empresas, os percentis praticamente entregam o número de cada uma. Isso é
problema de LGPD, não de código.

A defesa é **k-anonimato**: só divulgar agregados sobre um grupo de pelo menos `k` indivíduos
(aqui, `k = 5` empresas). Abaixo disso, o agregado não protege ninguém - some, recuse, ou
amplie o cohort.

Beat de fala: *"A IA é ótima no 'como'. Ela coda o percentil lindo. Mas ela não sabe que a
Solides leva LGPD a sério - esse 'o quê' e 'por quê' é seu. É aí que mora o seu valor."*

## Prompt pro Claude (ao vivo)

**Passo 1 - o invariante no domínio:**

> No `domain`, faz o `Cohort` recusar construção com menos de 5 empresas - lança um erro de
> domínio (ex.: `CohortTooSmallError`) na factory/constructor. O limite (`MIN_COHORT_SIZE = 5`)
> é uma constante de domínio. Quero que seja impossível ter um `Cohort` inválido em memória, não
> validar isso lá na borda.

**Passo 2 - os percentis:**

> Cria `application/percentis.ts` com uma função pura que, recebendo os KPIs da Solípse e um
> `Cohort` válido, devolve por KPI `{ valor, p25, p50, p75, p90, posicao }`. `posicao` é o
> percentil em que a Solípse cai. Sem LLM, sem I/O. Teste com `node:test`.

## Skill / MCP (cue)

- Nenhum. É código de domínio direto - o valor aqui é a **decisão**, não a ferramenta.

## Critério de aceite

- `node:test`: construir um `Cohort` com 4 empresas **lança** `CohortTooSmallError`; com 5+
  constrói normal.
- `percentis(...)` com os KPIs ruins da Solípse posiciona turnover e eNPS nas pontas (ex.: p95,
  p5) - coerente com o caso da etapa 5.
- A função de percentil **não** tem `if (cohort.length < 5)` - essa regra está no `Cohort`, não
  aqui.

```bash
pnpm --filter @workshop/backend test
```

## Gotchas

- **Método do percentil**: existe mais de uma convenção (interpolação linear vs. nearest-rank).
  Escolha uma e documente - números mudam um pouco entre elas.
- **k-anonimato é o piso, não o teto**: para dados muito sensíveis, l-diversity e
  t-closeness vão além. Aqui `k=5` basta pra demo, mas **diga** que é o piso.
- **Cohort no limite**: 5 empresas passa no k-anonimato mas dá uma distribuição pobre. Vale
  avisar no relatório quando o cohort for pequeno (qualidade, não privacidade).
- Não confunda **bloquear por privacidade** (k-anonimato, domínio) com **avisar por baixa
  amostragem** (qualidade, relatório) - são duas coisas.

## Referências

- [k-anonymity: a model for protecting privacy - Sweeney, 2002](https://dataprivacylab.org/dataprivacy/projects/kanonymity/kanonymity.pdf) (o paper que define k-anonimato)
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) (base legal pra tratar dado pessoal de RH)
- [k-anonymity - Wikipedia](https://en.wikipedia.org/wiki/K-anonymity) (resumo + l-diversity/t-closeness)
