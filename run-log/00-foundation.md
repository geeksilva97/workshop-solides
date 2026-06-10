# Run log - 00-foundation

- **Branch:** `run/00-foundation`
- **Base branch:** `main`
- **Spec:** the prebuild shell described in [`docs/README.md`](../docs/README.md) ("O que já está pronto")
- **Started:** 2026-06-10T19:05:04Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Construir o mínimo da casca pré-build pra que as etapas de pipeline (02-06) tenham tipos de
> domínio reais, ports e dados pra testar sem Postgres. Domínio com invariantes de verdade,
> ports que o infra implementa, repositório in-memory com cohort sintético + Solípse, e o
> esqueleto da busca híbrida com os stubs de live-build no lugar.

## Decisões

- **Sem Postgres no reference run.** `InMemoryCompanyRepository` faz `searchDense` por cosine
  sobre vetores multi-hot de `tags` (proxy determinístico de embeddings). Em produção troca-se
  o adapter por pgvector atrás do mesmo port `CompanyRepository`.
- **`Cohort` SEM o invariante de k-anonimato ainda.** A factory `Cohort.of` aceita qualquer
  tamanho. O guard (`< 5` bloqueia) é a etapa 05 - não implementar adiantado (convenção de
  live-build).
- **Stubs explícitos.** `searchLexical` e `hybridSearch` lançam `NotImplementedYetError('step
  NN ...')`. O primeiro pedaço faltante é o step 02 (BM25) - a sequência se encadeia sozinha.
- **Invariantes no domínio, não na borda.** `indicator.ts` valida rate [0,100], eNPS [-100,100],
  days > 0; `makeKpis` aplica em todo KPI na construção.
- Solípse com turnover 28.4 / eNPS -5 (ruins de propósito) pra percentis + judge terem o que dizer.

## Arquivos

- `domain/indicator.ts`, `domain/kpis.ts`, `domain/company.ts`, `domain/cohort.ts`
- `application/ports.ts` (CompanyRepository, Ranking, SearchProfile, NotImplementedYetError)
- `application/retrieval/hybrid-search.ts` (esqueleto, stubs)
- `infra/seed/companies.ts` (Solípse + 12 comparáveis), `infra/db/in-memory-company-repository.ts`
- Testes: `domain/indicator.test.ts`, `infra/db/in-memory-company-repository.test.ts`

## Interações & notas

- `dense search ranks the SaaS cluster above off-domain` confirma que o proxy semântico separa
  o cluster tech/SaaS do ruído (indústria/varejo/logística) - base pra mostrar o valor do BM25
  e do RRF depois.
- 6 testes verdes (3 de domínio, 2 de repo, 1 de health pré-existente).

## Verificação (2026-06-10T19:09:21Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/frontend:typecheck: cache miss, executing 4dd8f9379f186ad7
@workshop/backend:typecheck: cache miss, executing a335ecd183dea36b
@workshop/frontend:typecheck: $ tsc --noEmit
@workshop/backend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    0 cached, 2 total
  Time:    943ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/backend:test: cache miss, executing 3e7835a54cf4775d
@workshop/frontend:test: cache miss, executing 7a4eb21f22377dcc
@workshop/backend:test: $ node --test 'src/**/*.test.ts'
@workshop/frontend:test: $ vitest run
@workshop/backend:test: ✔ rate accepts a percentage in [0,100] and rejects out-of-range (0.449041ms)
@workshop/backend:test: ✔ enps accepts [-100,100], days must be positive (0.077ms)
@workshop/backend:test: ✔ makeKpis enforces every indicator invariant (0.065917ms)
@workshop/backend:test: ✔ dense search ranks the SaaS cluster above off-domain companies (1.083875ms)
@workshop/backend:test: ✔ lexical search is still a step-02 stub (0.228541ms)
@workshop/backend:test: {"level":30,"time":1781118563718,"pid":62673,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
@workshop/backend:test: ✔ GET /health returns ok (41.087375ms)
@workshop/backend:test: {"level":30,"time":1781118563720,"pid":62673,"hostname":"Edys-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":1.625500202178955,"msg":"request completed"}
@workshop/backend:test: ℹ tests 6
@workshop/backend:test: ℹ suites 0
@workshop/backend:test: ℹ pass 6
@workshop/backend:test: ℹ fail 0
@workshop/backend:test: ℹ cancelled 0
@workshop/backend:test: ℹ skipped 0
@workshop/backend:test: ℹ todo 0
@workshop/backend:test: ℹ duration_ms 164.264792
@workshop/frontend:test: 
@workshop/frontend:test:  RUN  v2.1.9 /Users/edy/projects/workshop-solides/apps/frontend
@workshop/frontend:test: 
@workshop/frontend:test:  ✓ src/App.test.tsx (1 test) 26ms
@workshop/frontend:test: 
@workshop/frontend:test:  Test Files  1 passed (1)
@workshop/frontend:test:       Tests  1 passed (1)
@workshop/frontend:test:    Start at  16:09:24
@workshop/frontend:test:    Duration  607ms (transform 19ms, setup 32ms, collect 64ms, tests 26ms, environment 230ms, prepare 32ms)
@workshop/frontend:test: 

 Tasks:    2 successful, 2 total
Cached:    0 cached, 2 total
  Time:    1.45s 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** domain (invariants) + ports + in-memory repo + seed + hybrid-search skeleton with live-build stubs
- **Finished:** 2026-06-10T19:09:24Z
