# run-log

Records of the **automated reference run** of the Tom Ranks workshop build.

Each `NN-slug.md` documents one step: the intent (the "prompt" for that step), the
decisions taken, the files touched, free-form interaction notes, and the captured
`typecheck`/`test` output. They exist so the workshop can be **accelerated when run for
real** - if a step needs to be skipped or caught up, the log shows exactly what was built
and how it was verified.

Each step lives on its own numbered branch `run/NN-slug`, chained off the previous step
(so `run/06-llm-as-judge` contains everything before it). Orchestrated by
[`scripts/workshop-run.sh`](../scripts/workshop-run.sh).

> **Reference-run caveat (steps 00-07):** these steps have no live Postgres/pgvector and no API
> keys, so they use **in-memory adapters and deterministic fakes** for the DB, embeddings,
> reranker and LLM judge - everything runs with `node --test` anywhere. The real workshop swaps
> those adapters behind the same ports; the pipeline logic built live is identical.
>
> **Step 08 closes that gap for the database:** it restores the real dump
> (`db/tom-ranks.dump.sql`, 107 companies with real embeddings) into Postgres + pgvector and
> swaps in `PgCompanyRepository` behind the same `CompanyRepository` port - proving the port
> swap and catching a bug the fakes hid (see `08-postgres.md`).

## Steps

| Branch | Step | Spec |
|--------|------|------|
| `run/00-foundation` | prebuild shell: domain, ports, in-memory repo, app skeleton | - |
| `run/01-screens` | frontend screens from Stitch | - |
| `run/02-bm25` | lexical search | [docs](../docs/steps/01-bm25.md) |
| `run/03-rrf` | rank fusion | [docs](../docs/steps/02-rrf.md) |
| `run/04-reranker` | cross-encoder rerank | [docs](../docs/steps/03-reranker.md) |
| `run/05-percentis-k-anonimato` | percentiles + k-anonymity invariant | [docs](../docs/steps/04-percentis-k-anonimato.md) |
| `run/06-llm-as-judge` | structured-output diagnosis | [docs](../docs/steps/05-llm-as-judge.md) |
| `run/07-verificacao` | verification (app + MCP) | [docs](../docs/steps/06-verificacao-mcp.md) |
| `run/08-postgres` | **real DB run**: pgvector dump + `PgCompanyRepository` (port swap) | [db/RESTORE.md](../db/RESTORE.md) |
