# workshop-solides

Monorepo for **Tom Ranks** - an HR benchmarking agent. pnpm workspaces + Turborepo.

## Layout

```
apps/
  frontend/   React 19 + Vite + TanStack Query   (tests: Vitest + React Testing Library)
  backend/    Fastify + native TypeScript          (tests: node:test)
packages/
  tsconfig/   @repo/tsconfig - base / node-app / react-app configs
```

### Backend architecture (four layers)

```
src/
  domain/        invariants of every object - the rules that must always hold
  application/   use cases that orchestrate the domain + define ports
  interface/     adapters in/out (Fastify HTTP routes live in interface/http)
  infra/         implementations of the ports (Postgres/pgvector, Anthropic SDK)
```

Dependencies point inward: `interface` and `infra` depend on `application`, which
depends on `domain`. The domain depends on nothing. See each layer's README.

## Toolchain

- **Node 24.4.1** (`.tool-versions`, via asdf). Runs `.ts` directly through native type
  stripping - the backend has no build step (`node src/main.ts`).
- **pnpm 11** package manager, **Turborepo 2** task runner.

## Commands (from repo root)

```bash
pnpm install        # install all workspaces
pnpm dev            # turbo run dev   (frontend + backend in watch mode)
pnpm test           # turbo run test
pnpm typecheck      # turbo run typecheck
pnpm build          # turbo run build
```

Per app: `pnpm --filter @workshop/frontend dev`, `pnpm --filter @workshop/backend dev`.
