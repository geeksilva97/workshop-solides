# Run log - 04-reranker

- **Branch:** `run/04-reranker`
- **Base branch:** `run/03-rrf`
- **Spec:** [`docs/steps/03-reranker.md`](../docs/steps/03-reranker.md)
- **Started:** 2026-06-10T19:20:39Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Reordenar o top-N fundido com um cross-encoder, atrás de um port `Reranker`, e cortar pra
> finalSize. O `application` não pode saber qual provider está atrás.

## Decisões

- **Port `Reranker`** em `application/ports.ts` (`rerank(query, docs) -> Scored[]`). O wiring
  no `hybridSearch` é agnóstico do provider - é o ponto da arquitetura desta etapa.
- **Adapter local determinístico** (`infra/reranker/local-cross-encoder.ts`): sem API key, ele
  pontua o par `(query, doc)` por Jaccard de tokens. Stand-in honesto pro Cohere Rerank /
  BGE-reranker-v2; trocar o adapter não mexe em `application`.
- **Reranker opcional no `hybridSearch`:** sem reranker devolve o fundido (caminho do step 03);
  com reranker, reordena e corta pra `finalSize` (20 por padrão). Mantém o teste do step 03 vivo
  e adiciona o caminho reranqueado.
- **Sub-agent/web (no workshop real):** é aqui que se lê o paper do cross-encoder COM a IA. No
  reference run isso é nota - o ponto codado é o port + wiring.

## Arquivos

- `application/ports.ts` (+ `Reranker`, `Scored`)
- `infra/reranker/local-cross-encoder.ts`
- `application/retrieval/hybrid-search.ts` (rerank ligado após RRF, corte em finalSize)
- Testes: `infra/reranker/local-cross-encoder.test.ts`, `hybrid-search.test.ts` (+caminho reranqueado)

## Interações & notas

- `with a reranker, hybridSearch reorders and trims to finalSize` confirma corte em 5 e ordem desc.
- 13 testes verdes (eram 11; +2 do reranker).

## Verificação (2026-06-10T19:22:25Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/backend:typecheck: cache miss, executing cb1a272066b3fd89
@workshop/frontend:typecheck: cache hit, replaying logs 80896e657f4ffacf
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    723ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing 3e69f112fad7a1ca
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
@workshop/backend:test: ✔ hybridSearch fuses dense + lexical via RRF (no longer a stub) (1.012584ms)
@workshop/backend:test: ✔ with a reranker, hybridSearch reorders and trims to finalSize (0.403458ms)
@workshop/backend:test: ✔ rrf reproduces the doc example - A wins by being good in both (0.620709ms)
@workshop/backend:test: ✔ an item present in only one ranking still scores, but lower (0.088916ms)
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.612416ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.103167ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.077709ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (0.583209ms)
@workshop/backend:test: ✔ lexical search (BM25) matches companies that share literal terms (0.397166ms)
@workshop/backend:test: ✔ tokenize lowercases, strips accents and drops stopwords (1.119208ms)
@workshop/backend:test: ✔ bm25 reproduces the doc example: TF saturates, rare terms win (0.258875ms)
@workshop/backend:test: ✔ reranker scores the relevant pair higher than the irrelevant one (0.485708ms)
@workshop/backend:test: {"level":30,"time":1781119347565,"pid":67829,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (42.509375ms)
@workshop/backend:test: {"level":30,"time":1781119347567,"pid":67829,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.5874996185302734,"msg":"request completed"}
@workshop/backend:test: ℹ tests 13
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 13
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 189.286042

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    506ms 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** Reranker port + local cross-encoder adapter wired after RRF
- **Finished:** 2026-06-10T19:22:27Z
