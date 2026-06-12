# workshop-solides

Fullstack TypeScript monorepo: React frontend + Fastify backend, managed with pnpm workspaces and Turborepo.

## Stack

- **Monorepo:** pnpm workspaces (v11) + Turborepo (v2) — tasks defined in `turbo.json`
- **Frontend (`apps/web`):** React 19, Vite 8, TypeScript 6, Vitest 4 (jsdom + Testing Library)
- **Backend (`apps/api`):** Fastify 5, Node.js (ESM), tsx for dev, Vitest 4
- **Shared (`packages/shared`):** zod 4 schemas + inferred types used by both apps
- Everything is ESM (`"type": "module"`).

## Structure

```
apps/
  web/        # React + Vite. Proxies /api -> http://localhost:3000 (vite.config.ts)
  api/        # Fastify. buildApp() in src/app.ts, listener in src/server.ts (port 3000)
packages/
  shared/     # @workshop/shared — zod schemas + types. Apps consume the BUILT output (dist/)
turbo.json    # build/test/typecheck depend on ^build; dev is persistent, uncached
tsconfig.base.json  # shared compiler options; each package extends it
```

## Commands (run from the repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Starts web (Vite, port 5173) and api (tsx watch, port 3000) together |
| `pnpm build` | Builds everything in dependency order, with caching |
| `pnpm test` | Runs all Vitest suites (builds dependencies first) |
| `pnpm typecheck` | Type-checks all packages |
| `pnpm --filter @workshop/api <script>` | Run a script in a single package |

## Testing rules

- **Before ANY commit, run `pnpm test` from the repo root and make sure every suite passes.** Never commit with failing or skipped-over tests. If a test fails, fix the code or the test first — do not commit and "fix later".
- If `packages/shared` changed, `pnpm test` already rebuilds it first (Turborepo `^build` dependency) — still run it from the root, not from a single package, so cross-package breakage is caught.
- New API routes get a test in `apps/api/src/*.test.ts` using `app.inject()` (no real server/port needed) — see `src/app.test.ts`.
- New React components/behavior get a test in `apps/web/src/*.test.tsx` with Testing Library; mock `fetch` with `vi.stubGlobal` — see `src/App.test.tsx`.
- Validate API payloads in tests with the zod schemas from `@workshop/shared` instead of hand-written shapes.

## Conventions

- **Shared contracts live in `@workshop/shared`:** any request/response shape used by both apps must be a zod schema there, with the type via `z.infer`. Don't duplicate types in web/api.
- `@workshop/shared` must be **rebuilt** before its consumers see changes — always run tasks through turbo (root scripts) rather than calling vitest/tsc directly in a package.
- API test files are **excluded from the tsc build** (`apps/api/tsconfig.json` excludes `src/**/*.test.ts`) so `dist/` never contains tests. Keep it that way — compiled tests in `dist/` get picked up by Vitest and run twice.
- Workspace dependencies use the `workspace:*` protocol.
- pnpm 10+ blocks dependency build scripts by default; approved ones live under `allowBuilds` in `pnpm-workspace.yaml` (currently only `esbuild`). If an install warns about ignored build scripts, add the package there deliberately — don't bypass it.

## Gotchas

- Node imports in the API need explicit `.js` extensions (`from "./app.js"`) because of NodeNext module resolution.
- The Vite dev server proxies `/api` to `localhost:3000` — frontend code calls `fetch('/api/...')` with relative URLs, never a hardcoded host.
- `apps/web` keeps the create-vite tsconfig layout (`tsconfig.app.json` + `tsconfig.node.json` via project references); `typecheck` there is `tsc -b`.
