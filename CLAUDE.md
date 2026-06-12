# workshop-solides

Fullstack TypeScript monorepo: React frontend + Fastify backend, managed with pnpm workspaces and Turborepo.

## Stack

- **Monorepo:** pnpm workspaces (v11) + Turborepo (v2) — tasks defined in `turbo.json`
- **Frontend (`apps/web`):** React 19, Vite 8, TypeScript 6, Vitest 4 (jsdom + Testing Library)
- **Backend (`apps/api`):** Fastify 5, Node.js (ESM). Runs TypeScript **natively** (Node 25 type stripping, no flags / no tsx / no build step). Tests use the built-in `node:test` runner.
- **Engine (`packages/engine`):** `@workshop/engine` — the benchmark pipeline (BM25, dense retrieval, RRF, reranker, percentiles, diagnostic). Pure logic + Ollama adapters. `node:test` + Stryker mutation testing.
- **Shared (`packages/shared`):** zod 4 schemas + inferred types used by every package.
- Everything is ESM (`"type": "module"`).

## Structure

```
apps/
  web/        # React + Vite. Proxies /api -> http://localhost:3000 (vite.config.ts)
  api/        # Fastify. buildApp() in src/app.ts, listener in src/server.ts (port 3000). Native TS, no build.
packages/
  shared/     # @workshop/shared — zod schemas + types. Consumers use the BUILT output (dist/)
  engine/     # @workshop/engine — benchmark pipeline. Source uses .ts imports; tsc emits dist/ for the api
turbo.json    # build/test/typecheck depend on ^build; dev is persistent, uncached
tsconfig.base.json  # shared compiler options; each package extends it
```

## Commands (run from the repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Starts web (Vite, port 5173) and api (`node --watch`, port 3000) together |
| `pnpm build` | Builds the packages that emit `dist/` (`shared`, `engine`) in dependency order, cached |
| `pnpm test` | Runs all suites — `node:test` for api/engine, Vitest for web (builds dependencies first) |
| `pnpm typecheck` | Type-checks all packages |
| `pnpm --filter @workshop/engine test:mutation` | Stryker mutation testing on the engine |
| `pnpm --filter @workshop/api <script>` | Run a script in a single package |

## Testing rules

- **Before ANY commit, run `pnpm test` from the repo root and make sure every suite passes.** Never commit with failing or skipped-over tests. If a test fails, fix the code or the test first — do not commit and "fix later".
- If `packages/shared` changed, `pnpm test` already rebuilds it first (Turborepo `^build` dependency) — still run it from the root, not from a single package, so cross-package breakage is caught.
- **api and engine use `node:test`** (`import { test } from "node:test"; import assert from "node:assert/strict"`), run via `node --test`. The web app stays on Vitest. Don't reintroduce Vitest in the backend.
- New API routes get a test in `apps/api/src/*.test.ts` using `app.inject()` (no real server/port needed) — see `src/app.test.ts`.
- Engine logic gets a `*.test.ts` next to it and should hold a healthy **mutation score** (`pnpm --filter @workshop/engine test:mutation`, break threshold 70). Pure functions over LLM/network calls — inject Ollama via the `Embedder`/`Reranker` ports and use fakes in tests.
- New React components/behavior get a test in `apps/web/src/*.test.tsx` with Testing Library; mock `fetch` with `vi.stubGlobal` — see `src/App.test.tsx`.
- Validate API payloads in tests with the zod schemas from `@workshop/shared` instead of hand-written shapes.

## Conventions

- **Shared contracts live in `@workshop/shared`:** any request/response shape used by both apps must be a zod schema there, with the type via `z.infer`. Don't duplicate types in web/api.
- `@workshop/shared` must be **rebuilt** before its consumers see changes — always run tasks through turbo (root scripts) rather than calling vitest/tsc directly in a package.
- The `engine` package excludes `src/**/*.test.ts` from the tsc build so `dist/` never ships tests. Keep it that way. (`apps/api` has no build step, but mirrors the exclude for consistency.)
- Workspace dependencies use the `workspace:*` protocol.
- pnpm 10+ blocks dependency build scripts by default; approved ones live under `allowBuilds` in `pnpm-workspace.yaml` (currently only `esbuild`). If an install warns about ignored build scripts, add the package there deliberately — don't bypass it.

## Gotchas

- **Relative-import extensions differ by package, because of how each is run:**
  - `apps/api` and `packages/engine` run their `.ts` **directly** under Node (native type stripping / `node --test`), and Node does **not** remap `.js` specifiers to `.ts` on disk. So intra-package relative imports use the real `.ts` extension (`from "./app.ts"`). Their tsconfigs set `allowImportingTsExtensions` + `rewriteRelativeImportExtensions`, so `engine`'s `tsc` build still emits `.js` imports in `dist/`.
  - `packages/shared` is only ever **compiled** (never run from source), so it keeps `.js` extensions (`from "./hello.js"`), which `tsc` resolves at build time.
  - Cross-package imports use the bare specifier (`@workshop/shared`, `@workshop/engine`) and resolve via each package's `exports` to its built `dist/`.
- Engine/api source must be **erasable-syntax-only** (`erasableSyntaxOnly` is on): no `enum`, `namespace`, or constructor parameter properties — type stripping can't transform them. Use `const` objects / unions instead.
- The Vite dev server proxies `/api` to `localhost:3000` — frontend code calls `fetch('/api/...')` with relative URLs, never a hardcoded host.
- `apps/web` keeps the create-vite tsconfig layout (`tsconfig.app.json` + `tsconfig.node.json` via project references); `typecheck` there is `tsc -b`.
