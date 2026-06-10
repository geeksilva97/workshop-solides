# CLAUDE.md - frontend (@workshop/frontend)

Rules for Claude Code working in the frontend. Read the [root CLAUDE.md](../../CLAUDE.md) first.

## What this is

The Tom Ranks web UI: **React 19 + Vite 6 + TanStack Query**, tested with **Vitest + React
Testing Library**. It renders the SaaS shell (Sign In, "Seus benchmarks" home) and the four
benchmark screens that visualize the agent's output.

## Stack conventions

- **TanStack Query** for all server state - data fetching, caching, mutations. The
  `QueryClientProvider` is wired in `src/main.tsx`. Don't fetch in `useEffect`; use
  `useQuery`/`useMutation`. Keep query keys structured and colocated with their feature.
- **Vite** dev server on port `5173`. `tsconfig.json` extends `@repo/tsconfig/react-app.json`.
- Build is `vite build` (esbuild), so type errors don't fail the build - run `pnpm typecheck`
  (`tsc --noEmit`) separately. CI/pre-push should run both.

## Testing (Vitest + RTL)

- Tests are `src/**/*.test.tsx`, run with Vitest in `jsdom` (`vite.config.ts` -> `test`).
- `vitest.setup.ts` loads `@testing-library/jest-dom/vitest` (matchers like `toBeInTheDocument`).
- **Test behavior, not implementation**: query by role/label/text (`getByRole`), simulate with
  `@testing-library/user-event`. See `src/App.test.tsx` for the baseline pattern.
- Components that fetch must be rendered inside a `QueryClientProvider` in the test (use a fresh
  `QueryClient` per test with retries off).

```bash
pnpm --filter @workshop/frontend dev
pnpm --filter @workshop/frontend test
pnpm --filter @workshop/frontend typecheck
```

## Screens & design source

Screens come from the HTML mockups + the canonical **Google Stitch** project
(`11048422501635958897`), pulled via the Stitch MCP.

| Screen | Route | In scope |
|--------|-------|----------|
| Sign In | `/login` | yes (scaffold - login, no signup) |
| Seus benchmarks (home) | `/` | yes |
| Novo benchmark | `/benchmark/novo` | yes |
| Rodando o benchmark | `/benchmark/:id/run` | yes |
| Lista de cohort | `/benchmark/:id/cohort` | yes |
| Dashboard + diagnóstico | `/benchmark/:id` | yes |
| Criar conta / Reset password | - | **out** (login only, accounts are pre-seeded) |

## Solides brand (verified)

- **Primary purple `#80297D`** (vivid magenta `#D61CED` in gradients), **amber/gold accent
  `#FFBA00`**, navy text `#33475B`, white background.
- Font **Poppins**. Buttons are **pill** (heavily rounded); cards have ~14px corners.
- **Solides is NOT green.** Green only survives as a semantic signal ("healthy / better than
  cohort"). An early build mistakenly used green and the mockups were redone - don't reintroduce
  it as a brand color.

## Auth & API

- **Login, no signup.** Accounts are pre-seeded; the Sign In screen posts to the API, which sets
  a signed-cookie session. Protected routes redirect to `/login` without a session.
- The benchmark screens call the backend endpoints. Per the workshop convention, **what sits
  behind an endpoint may be stubbed** until its backend step is built live - the UI should
  handle the loading/running states regardless (the "Rodando" screen exists for this).

## Live-build reminder

The frontend shell is **pre-build** (set up before stage, shown not built). Don't treat UI work
as a live-build step unless asked. The stage time is for the backend pipeline - see
[`docs/steps/`](../../docs/steps).
