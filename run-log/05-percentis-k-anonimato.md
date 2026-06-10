# Run log - 05-percentis-k-anonimato

- **Branch:** `run/05-percentis-k-anonimato`
- **Base branch:** `run/04-reranker`
- **Spec:** [`docs/steps/04-percentis-k-anonimato.md`](../docs/steps/04-percentis-k-anonimato.md)
- **Started:** 2026-06-10T19:22:57Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Calcular a distribuição do cohort (p25/p50/p75/p90) por KPI e posicionar a Solípse, e -
> inegociável - colocar o k-anonimato como invariante do `Cohort` (não um if na borda).

## Decisões

- **k-anonimato no domínio:** `Cohort.of` lança `CohortTooSmallError` se `< MIN_COHORT_SIZE`
  (5). É impossível ter um `Cohort` inválido em memória. A regra é de domínio (LGPD), não da
  função de percentil nem do caller. Foi o `Cohort` da foundation ganhando o guard - o trabalho
  exato desta etapa ao vivo.
- **`percentis` é função pura** em `application/percentis.ts`: quantis por interpolação linear
  (type-7) + percentile rank + sinal semântico (ok/warn/bad, respeitando "maior é pior" exceto
  eNPS). **Não re-checa tamanho** - confia num `Cohort` válido. Separação explícita: bloquear
  por privacidade (domínio) ≠ calcular (aplicação).

## Arquivos

- `domain/cohort.ts` (+ `MIN_COHORT_SIZE`, `CohortTooSmallError`, guard em `of`)
- `application/percentis.ts` (`percentis`, `quantile`, `percentileRank`)
- Testes: `domain/cohort.test.ts` (4 lança, 5 ok), `application/percentis.test.ts`

## Interações & notas

- `positions Solípse at the extremes` confirma: turnover >= p90 (bad), eNPS <= p10 (bad) contra
  o cohort tech - exatamente o que o judge precisa pra narrar.
- 16 testes verdes (eram 13; +3 de cohort/percentis).

## Verificação (2026-06-10T19:24:19Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/backend:typecheck: cache miss, executing 468035883d87624d
@workshop/frontend:typecheck: cache hit, replaying logs 80896e657f4ffacf
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    703ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing cfd3f354dfd08092
@workshop/frontend:test: cache hit, replaying logs 2cc3f17a647ef974
@workshop/frontend:test: $ vitest run
@workshop/frontend:test: 
@workshop/frontend:test:  RUN  v2.1.9 /Users/edy/projects/workshop-solides/apps/frontend
@workshop/frontend:test: 
@workshop/frontend:test:  ✓ src/pages/SignIn.test.tsx (1 test) 34ms
@workshop/frontend:test:  ✓ src/pages/SeusBenchmarks.test.tsx (1 test) 36ms
@workshop/frontend:test: 
@workshop/frontend:test:  Test Files  2 passed (2)
@workshop/frontend:test:       Tests  2 passed (2)
@workshop/frontend:test:    Start at  16:16:17
@workshop/frontend:test:    Duration  513ms (transform 43ms, setup 55ms, collect 163ms, tests 70ms, environment 291ms, prepare 49ms)
@workshop/frontend:test: 
@workshop/backend:test: $ node --test 'src/**/*.test.ts'
@workshop/backend:test: ✔ positions Solípse at the extremes its bad KPIs deserve (0.4815ms)
@workshop/backend:test: ✔ percentis does not re-check cohort size - that lives in the Cohort (1.290375ms)
@workshop/backend:test: ✔ hybridSearch fuses dense + lexical via RRF (no longer a stub) (0.974375ms)
@workshop/backend:test: ✔ with a reranker, hybridSearch reorders and trims to finalSize (0.341ms)
@workshop/backend:test: ✔ rrf reproduces the doc example - A wins by being good in both (1.3085ms)
@workshop/backend:test: ✔ an item present in only one ranking still scores, but lower (0.111375ms)
@workshop/backend:test: ✔ Cohort enforces k-anonymity at construction (0.436541ms)
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.467042ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.081375ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.069083ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (0.533292ms)
@workshop/backend:test: ✔ lexical search (BM25) matches companies that share literal terms (0.424625ms)
@workshop/backend:test: ✔ tokenize lowercases, strips accents and drops stopwords (0.585334ms)
@workshop/backend:test: ✔ bm25 reproduces the doc example: TF saturates, rare terms win (0.215375ms)
@workshop/backend:test: ✔ reranker scores the relevant pair higher than the irrelevant one (0.428083ms)
@workshop/backend:test: {"level":30,"time":1781119462016,"pid":68597,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (43.157208ms)
@workshop/backend:test: {"level":30,"time":1781119462018,"pid":68597,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.5595002174377441,"msg":"request completed"}
@workshop/backend:test: ℹ tests 16
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 16
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 215.318375

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    535ms 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** percentis puro + k-anonimato como invariante do Cohort
- **Finished:** 2026-06-10T19:24:22Z
