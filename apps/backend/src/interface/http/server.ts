import Fastify, { type FastifyInstance } from 'fastify';
import type { BenchmarkDeps } from '../../application/run-benchmark.ts';
import { runBenchmark } from '../../application/run-benchmark.ts';
import { InMemoryCompanyRepository } from '../../infra/db/in-memory-company-repository.ts';
import { PgCompanyRepository } from '../../infra/db/pg-company-repository.ts';
import { LocalCrossEncoderReranker } from '../../infra/reranker/local-cross-encoder.ts';
import { LocalJudge } from '../../infra/judge/local-judge.ts';
import { SOLIPSE } from '../../infra/seed/companies.ts';

/**
 * Composition of the HTTP interface layer. The composition root wires the infra
 * adapters into the application use cases. In production, swap the in-memory /
 * local adapters for Postgres + Cohere + Anthropic - the routes don't change.
 */
export function buildServer(deps: BenchmarkDeps = defaultDeps()): FastifyInstance {
  const server = Fastify({ logger: true });

  server.get('/health', async () => ({ status: 'ok' }));

  // Runs the full pipeline for the client company (Solípse). The client is
  // loaded FROM the repository (by id), not from a constant - so its profile
  // and embedding match the pool and it is correctly excluded from its own
  // cohort. Falls back to the seed constant only if the id isn't in the repo.
  server.get('/benchmark/solipse', async () => {
    const client = (await deps.repo.getById('client-solipse')) ?? SOLIPSE;
    const result = await runBenchmark(deps, client);
    return {
      empresa: result.empresa,
      cohort: result.cohort.map((c) => ({ id: c.id, name: c.name, sector: c.sector })),
      kpis: result.kpis,
      diagnostico: result.diagnostico,
    };
  });

  return server;
}

function defaultDeps(): BenchmarkDeps {
  // Real Postgres + pgvector when DATABASE_URL is set (the restored dump);
  // in-memory fakes otherwise. The application sees only the port either way.
  const repo = process.env.DATABASE_URL
    ? new PgCompanyRepository(process.env.DATABASE_URL)
    : new InMemoryCompanyRepository();
  return {
    repo,
    reranker: new LocalCrossEncoderReranker(),
    judge: new LocalJudge(),
  };
}
