# Run log - 03-rrf

- **Branch:** `run/03-rrf`
- **Base branch:** `run/02-bm25`
- **Spec:** [`docs/steps/02-rrf.md`](../docs/steps/02-rrf.md)
- **Started:** 2026-06-10T19:18:48Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Fundir os rankings da dense e do BM25 num só, olhando só pra posição (RRF), e ligar no
> `hybridSearch`. Função pura, `k=60`, testada com o exemplo do paper.

## Decisões

- **Função pura** `application/retrieval/rrf.ts` - sem I/O, determinística. Soma `1/(k+rank)`
  por empresa em todos os rankings; `k=60` do paper. Vive em `application` porque é aritmética
  de posição, não toca banco.
- **Stub do step 03 removido:** `hybridSearch` agora faz dense + lexical + `rrf([dense, lexical])`
  e devolve o top-N fundido. Deixei o marcador `// step 04: rerank` - o reranker é a próxima
  camada, e até lá o RRF já entrega um cohort válido (não-reranqueado).
- Mantive `finalSize` no config pro reranker cortar pra top-20 na etapa 04.

## Arquivos

- `application/retrieval/rrf.ts`
- `application/retrieval/hybrid-search.ts` (RRF ligado; sem mais throw)
- Testes: `application/retrieval/rrf.test.ts` (exemplo do doc), `hybrid-search.test.ts` (integração)

## Interações & notas

- `rrf reproduces the doc example` confirma: A (1º dense, 2º bm25) ganha de C (1º bm25, 4º dense).
- `hybridSearch` deixou de lançar `NotImplementedYetError` - de stub a pipeline parcial.
- 11 testes verdes no backend (eram 8; +3 de RRF/hybrid).

## Verificação (2026-06-10T19:20:09Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/backend:typecheck: cache miss, executing 8a5e20b066ff6b8e
@workshop/frontend:typecheck: cache hit, replaying logs 80896e657f4ffacf
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    714ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing 4e48c065ea5d46c2
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
@workshop/backend:test: ✔ hybridSearch fuses dense + lexical via RRF (no longer a stub) (0.907417ms)
@workshop/backend:test: ✔ rrf reproduces the doc example - A wins by being good in both (0.614167ms)
@workshop/backend:test: ✔ an item present in only one ranking still scores, but lower (0.085333ms)
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.445125ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.077084ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.065958ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (0.520083ms)
@workshop/backend:test: ✔ lexical search (BM25) matches companies that share literal terms (0.373417ms)
@workshop/backend:test: ✔ tokenize lowercases, strips accents and drops stopwords (0.602292ms)
@workshop/backend:test: ✔ bm25 reproduces the doc example: TF saturates, rare terms win (0.214333ms)
@workshop/backend:test: {"level":30,"time":1781119211069,"pid":66937,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (39.527125ms)
@workshop/backend:test: {"level":30,"time":1781119211071,"pid":66937,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.502708911895752,"msg":"request completed"}
@workshop/backend:test: ℹ tests 11
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 11
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 173.846417

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    486ms 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** RRF pure fusion wired into hybridSearch (dense+BM25 -> fused top-N)
- **Finished:** 2026-06-10T19:20:11Z
