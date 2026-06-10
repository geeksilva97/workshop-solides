# Run log - 01-screens

- **Branch:** `run/01-screens`
- **Base branch:** `run/00-foundation`
- **Spec:** telas do plano + projeto Stitch canônico (puxado via MCP nesta sessão)
- **Started:** 2026-06-10T19:09:52Z

> Automated reference run, executed interactively. Captures the intent, the
> decisions, the files touched, and the verification output for this step.

## Intenção (o "prompt" da etapa)

> Implementar as telas do Tom Ranks a partir do design do Stitch: Sign In, Seus benchmarks,
> Novo benchmark, Rodando, Lista de Cohort e Dashboard. React 19 + Vite + Tailwind v4 + TanStack
> Query, na marca Sólides, com client de API stubbed (login-only, sem cadastro).

## Decisões

- **Fonte do design:** `mcp__stitch__list_screens` no projeto canônico `11048422501635958897`
  (todas as 7 telas in-scope existem lá) + `WebFetch` do HTML do Sign In pra confirmar a
  estrutura (logo, "Bem-vindo", e-mail/senha). Estilo construído a partir da marca verificada,
  não copiando o HTML do Stitch 1:1.
- **Tailwind v4** via `@tailwindcss/vite` + tokens em `@theme` (roxo `#80297d`, âmbar `#ffba00`,
  navy `#33475b`, Poppins, botões pill, cards 14px). Verde só como sinal semântico (ok/warn/bad).
- **TanStack Query** pra todo estado de servidor (`useBenchmarks`, `useBenchmark`, `useLogin`,
  `useCreateBenchmark`) contra `api` stubbed - números espelham o caso Solípse dos docs.
- **Login-only:** sessão fake em `localStorage`; `Protected` redireciona pra `/login`. Sem
  cadastro/reset (fora de escopo).
- **Amarração com o pipeline:** a tela "Rodando" lista as 6 etapas (dense -> BM25 -> RRF ->
  reranker -> percentis -> judge), o mesmo encadeamento que será construído ao vivo no backend.
- Removi `App.tsx`/`App.test.tsx` (scaffold) - substituídos por `routes.tsx` + páginas.

## Arquivos

- Config: `package.json` (+ react-router-dom, tailwindcss, @tailwindcss/vite), `vite.config.ts`,
  `index.html` (Poppins), `src/index.css` (tokens da marca)
- App: `src/main.tsx`, `src/routes.tsx`, `src/components/Layout.tsx`, `src/ui/primitives.tsx`
- Dados: `src/api/{types,client,hooks}.ts`, `src/lib/session.ts`
- Páginas: `src/pages/{SignIn,SeusBenchmarks,NovoBenchmark,RodandoBenchmark,ListaCohort,Dashboard}.tsx`
- Testes: `src/pages/{SignIn,SeusBenchmarks}.test.tsx`, `src/test/utils.tsx` (renderWithProviders)

## Interações & notas

- `WebFetch` do HTML do Stitch trouxe a estrutura mas não o CSS inline - suficiente pra layout;
  cores/tipografia vieram da marca documentada.
- 2 testes de front verdes (Sign In renderiza; Seus benchmarks lista via Query+stub).
- `vite build` OK: 99 módulos, CSS 14.31 kB (Tailwind compilou a marca).

## Verificação (2026-06-10T19:16:14Z)

```
$ pnpm typecheck
$ turbo run typecheck
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running typecheck in 3 packages
   • Remote caching disabled

@workshop/frontend:typecheck: cache miss, executing 80896e657f4ffacf
@workshop/backend:typecheck: cache hit, replaying logs a335ecd183dea36b
@workshop/backend:typecheck: $ tsc --noEmit
@workshop/frontend:typecheck: $ tsc --noEmit

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    914ms 

$ pnpm test
$ turbo run test
• turbo 2.9.17

   • Packages in scope: @repo/tsconfig, @workshop/backend, @workshop/frontend
   • Running test in 3 packages
   • Remote caching disabled

@workshop/frontend:test: cache miss, executing 2cc3f17a647ef974
@workshop/backend:test: cache hit, replaying logs 3e7835a54cf4775d
@workshop/backend:test: $ node --test 'src/**/*.test.ts'
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

 Tasks:    2 successful, 2 total
Cached:    1 cached, 2 total
  Time:    1.017s 

```

- typecheck exit: 0 | test exit: 0
- **Resumo:** telas Sign In/home/novo/run/cohort/dashboard (React+Tailwind v4+TanStack Query) a partir do Stitch
- **Finished:** 2026-06-10T19:16:17Z
