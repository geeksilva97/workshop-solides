# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

**Tom Ranks** - an HR benchmarking agent built live during a workshop for the Solides
engineering team. It receives the HR indicators of a client company (fictional **Solípse**),
finds a cohort of comparable companies, positions each KPI in the cohort's distribution, and
turns the numbers into an actionable diagnosis.

The architecture under the hood is a real search stack: **hybrid retrieval (dense + BM25) ->
RRF -> reranker -> LLM-as-judge**. The point of the workshop is the *dev workflow with AI*, not
teaching search - the agent is the vehicle.

> Full build plan, per-step: [`docs/`](./docs/README.md). Read that before touching pipeline code.

## Monorepo layout

```
apps/
  frontend/   React 19 + Vite + TanStack Query   (tests: Vitest + React Testing Library)
  backend/    Fastify 5 + native TypeScript        (tests: node:test) - four-layer architecture
packages/
  tsconfig/   @repo/tsconfig - base / node-app / react-app configs
```

Each app has its own `CLAUDE.md` with rules specific to it. Read the relevant one before editing
that app.

## Toolchain (important)

- **Node 24.4.1** (`.tool-versions`, via asdf - not nvm). Node runs `.ts` directly via native
  type stripping, so the **backend has no build step** (`node src/main.ts`).
- **pnpm 11** is the package manager, **Turborepo 2** the task runner. Turbo config uses the
  2.x `"tasks"` key in `turbo.json`.
- **pnpm 11 gotcha**: `overrides` and build-script approvals (`allowBuilds`) live in
  `pnpm-workspace.yaml`, **not** `package.json` - pnpm 11 ignores the `pnpm` field in
  `package.json`. There's a `vite` override there deduping Vite to v6 so the app and Vitest
  don't pull two majors (which breaks plugin types).

## Commands (from repo root)

```bash
pnpm install        # install all workspaces
pnpm dev            # turbo run dev   (frontend + backend in watch mode)
pnpm test           # turbo run test
pnpm typecheck      # turbo run typecheck
pnpm format         # prettier --write .
```

Per app: `pnpm --filter @workshop/frontend <script>`, `pnpm --filter @workshop/backend <script>`.

## Workshop build convention (do not violate)

This repo is built in two phases. It matters how code lands here:

- **Pre-build** (the shell): monorepo, login + session, screens, the populated DB, dense
  retrieval, the agent loop. Commodity - it's set up before the stage and only shown.
- **Live-build** (the logic): BM25, RRF, reranker, percentiles + k-anonymity, LLM-as-judge. This
  is the only code written on stage, in order. See [`docs/steps/`](./docs/steps).

**The rule: a stub stays a stub until its live-build step.** Screens already call the API, but
what sits behind an endpoint stays stubbed until that step is built live. **Do not implement a
step ahead of its turn**, even if asked to "finish the pipeline" - confirm which step is in scope.

## Conventions

- **TypeScript everywhere.** Shared validation via Zod when introduced; schemas shared front/back.
- **No em dashes (`—`) and no Unicode arrows (`→`) in docs or comments** - use ` - ` and `->`.
  (Workshop author's house style; keep it consistent across the repo.)
- **Commit related changes separately** - one logical change per commit, not a grab-bag.
- **Tests are live templates** - the smoke tests (`App.test.tsx`, `server.test.ts`) exist to
  show the testing setup works. Build on them; don't delete the pattern.
- Run `pnpm typecheck` and `pnpm test` before pushing.

## Deployment / remote

- GitHub (private): `geeksilva97/workshop-solides`, default branch `main`, SSH remote.
- Commit/push only when asked.
