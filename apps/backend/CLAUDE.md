# CLAUDE.md - backend (@workshop/backend)

Rules for Claude Code working in the backend. Read the [root CLAUDE.md](../../CLAUDE.md) first.

## What this is

The Tom Ranks API: **Fastify 5** on **Node 24 native TypeScript** (no build step), tested with
**`node:test`**. It runs the benchmark pipeline (hybrid retrieval -> RRF -> reranker ->
percentiles + k-anonymity -> LLM-as-judge) behind HTTP endpoints.

## Four-layer architecture (the spine - do not blur it)

```
src/
  domain/        invariants of every object the system reasons about
  application/   use cases that orchestrate the domain + the ports they need + pure functions
  interface/     adapters in/out (HTTP lives in interface/http - Fastify routes)
  infra/         implementations of the ports (Postgres/pgvector, reranker, Anthropic SDK)
  main.ts        composition root: wire infra -> application -> interface, start the server
```

**Dependencies point inward.** `interface` and `infra` depend on `application`, which depends on
`domain`. The domain depends on nothing - no Fastify, no SQL, no SDK imports.

### domain is NOT a folder of interfaces

This is the rule the workshop is built to prove. The domain holds the **invariants** - the rules
that must always be true for an object to exist - enforced *in the object itself*
(constructor/factory/value object), not validated ad-hoc at the border.

- A `Cohort` cannot be constructed below the **k-anonymity** threshold (>= 5 companies). That's a
  domain error thrown in the factory, not an `if` in the percentile function.
- An `Indicator` representing a rate can't be negative.
- A `Diagnostico`'s shape is validated as a domain rule, not trusted from the LLM.

If a rule is universal to the object, it lives in `domain`. Use-case orchestration goes to
`application`; HTTP to `interface`; DB/external calls to `infra`. See each layer's `README.md`.

### Where pipeline pieces go

| Piece | Layer | Why |
|-------|-------|-----|
| `Company`, `Indicator`, `Cohort` (k-anonymity), `Diagnostico` | `domain` | invariants |
| RRF, percentiles | `application` | pure functions, no I/O |
| `CompanyRepository`, `Reranker`, `Judge` ports | `application` | application defines, infra implements |
| dense (cosine) + BM25 (Postgres FTS) queries | `infra` | touches the DB |
| Cohere/BGE rerank, Anthropic judge | `infra` | external calls |
| Fastify routes | `interface/http` | transport only - parse, call use case, shape response |

## Native TypeScript conventions

- Node strips types at runtime. **Use explicit `.ts` extensions in relative imports**
  (`./server.ts`), and `import type` for type-only imports.
- The tsconfig sets **`erasableSyntaxOnly`** - no `enum`, no `namespace`, no
  parameter-properties (`constructor(private x)`). Use plain unions/objects and explicit field
  assignment instead. tsc is **typecheck-only** (`--noEmit`); Node runs the source.
- `tsconfig.json` extends `@repo/tsconfig/node-app.json`.

## Testing (`node:test`)

- Tests are `src/**/*.test.ts`, run with `node --test`. Use `node:test` + `node:assert/strict`.
- For HTTP, build the server via `buildServer()` and use Fastify's `server.inject(...)` - no
  real port needed (see `interface/http/server.test.ts`).
- Mock external calls (Postgres, Cohere, Anthropic) at the **port** boundary - that's what the
  ports are for.

```bash
pnpm --filter @workshop/backend test
pnpm --filter @workshop/backend dev    # node --watch src/main.ts
```

## Live-build reminder

BM25, RRF, reranker, percentiles+k-anonymity, and the judge are **built on stage, in order**
(see [`docs/steps/`](../../docs/steps)). Keep behind-the-endpoint logic stubbed until its step.
Don't implement ahead.
