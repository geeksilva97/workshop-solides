# Run log - 07-verificacao

- **Branch:** `run/07-verificacao`
- **Base branch:** `run/06-llm-as-judge`
- **Spec:** [`docs/steps/06-verificacao-mcp.md`](../docs/steps/06-verificacao-mcp.md)
- **Started:** 2026-06-10T19:29:37Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Fechar o loop: costurar o pipeline inteiro num caso de uso + rota, com teste de integração
> fim-a-fim, e usar o MCP do Chrome pra a IA *ver* a tela renderizada e conferir contra o JSON.

## Decisões

- **Capstone de integração:** `application/run-benchmark.ts` compõe o agente inteiro -
  `hybridSearch` (dense + BM25 -> RRF -> reranker) -> `Cohort.of` (k-anonimato) -> `percentis`
  -> `gerarDiagnostico` (judge). Cada peça é a real construída nas etapas; só os adapters trocam.
- **Composition root** em `interface/http/server.ts`: `buildServer(deps?)` injeta os adapters
  (in-memory repo, local reranker, local judge) e expõe `GET /benchmark/solipse`. Em produção,
  troca os adapters - a rota não muda.
- **Verificação por MCP (a beat de destaque):** com o front no ar (`:5173`), usei o
  **chrome-devtools MCP** pra navegar até o dashboard, tirar um snapshot do a11y tree e
  conferir que os números renderizados batem com o JSON do pipeline. A IA *leu* a tela.

## Arquivos

- `application/run-benchmark.ts` (composição fim-a-fim)
- `interface/http/server.ts` (composition root + rota `GET /benchmark/solipse`)
- Testes: `application/run-benchmark.test.ts`, `interface/http/server.test.ts` (rota)
- Artefatos: `artifacts-07-benchmark-solipse.json` (saída real da API), `artifacts-07-signin.png`,
  `artifacts-07-dashboard.png` (screenshots via MCP)

## Interações & notas

- **Pipeline fim-a-fim verde:** `the full pipeline runs end to end and diagnoses Solípse` -
  cohort >= 5 (k-anon), 4 KPIs, diagnóstico flagando turnover.
- **API real:** `curl localhost:3401/benchmark/solipse` devolveu cohort + percentis + diagnóstico
  (salvo em `artifacts-07-benchmark-solipse.json`).
- **MCP Chrome:** snapshot do dashboard confirmou os números na tela = JSON do pipeline:
  turnover **p95 / 28.4%**, absenteísmo **p92 / 5.2%**, eNPS **p5 / -5**, diagnóstico principal
  "Problema de retenção, não de atração". Olhos e mãos no mundo - verificar, não confiar.
- 22 testes verdes no backend (eram 20; +2 do run-benchmark e da rota) + 2 no front.

## Verificação (2026-06-10T19:33:22Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/backend:typecheck: cache miss, executing 70d64d4247331470
@workshop/frontend:typecheck: cache hit, replaying logs 80896e657f4ffacf
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    795ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing 936331edbcbfbb5a
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
@workshop/backend:test: ✔ gerarDiagnostico produces a valid diagnosis from the local judge (0.454584ms)
@workshop/backend:test: ✔ gerarDiagnostico rejects a judge that returns an off-schema payload (0.211417ms)
@workshop/backend:test: ✔ positions Solípse at the extremes its bad KPIs deserve (2.21925ms)
@workshop/backend:test: ✔ percentis does not re-check cohort size - that lives in the Cohort (5.671459ms)
@workshop/backend:test: ✔ hybridSearch fuses dense + lexical via RRF (no longer a stub) (0.872542ms)
@workshop/backend:test: ✔ with a reranker, hybridSearch reorders and trims to finalSize (0.326625ms)
@workshop/backend:test: ✔ rrf reproduces the doc example - A wins by being good in both (0.686917ms)
@workshop/backend:test: ✔ an item present in only one ranking still scores, but lower (0.09575ms)
@workshop/backend:test: ✔ the full pipeline runs end to end and diagnoses Solípse (1.346167ms)
@workshop/backend:test: ✔ Cohort enforces k-anonymity at construction (0.478417ms)
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.454792ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.078291ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.068125ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (7.216583ms)
@workshop/backend:test: ✔ lexical search (BM25) matches companies that share literal terms (0.422792ms)
@workshop/backend:test: ✔ AnthropicJudge forces the tool and returns its input (client mocked) (0.57575ms)
@workshop/backend:test: ✔ AnthropicJudge throws if the model returns no tool_use block (0.133583ms)
@workshop/backend:test: ✔ tokenize lowercases, strips accents and drops stopwords (1.2195ms)
@workshop/backend:test: ✔ bm25 reproduces the doc example: TF saturates, rare terms win (0.257834ms)
@workshop/backend:test: ✔ reranker scores the relevant pair higher than the irrelevant one (0.451417ms)
@workshop/backend:test: {"level":30,"time":1781120004645,"pid":71983,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (40.802625ms)
@workshop/backend:test: {"level":30,"time":1781120004649,"pid":71983,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/benchmark/solipse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /benchmark/solipse runs the pipeline and returns a diagnosis (2.915542ms)
@workshop/backend:test: {"level":30,"time":1781120004647,"pid":71983,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.5062079429626465,"msg":"request completed"}
@workshop/backend:test: {"level":30,"time":1781120004650,"pid":71983,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.5355000495910645,"msg":"request completed"}
@workshop/backend:test: ℹ tests 22
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 22
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 256.220541

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    569ms 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** pipeline end-to-end (run-benchmark + route) + chrome-devtools MCP verification of the rendered dashboard
- **Finished:** 2026-06-10T19:33:24Z
