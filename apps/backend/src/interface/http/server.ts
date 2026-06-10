import Fastify, { type FastifyInstance } from 'fastify';
import type { BenchmarkDeps } from '../../application/run-benchmark.ts';
import { runBenchmark } from '../../application/run-benchmark.ts';
import { InMemoryCompanyRepository } from '../../infra/db/in-memory-company-repository.ts';
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

  // Runs the full pipeline for the seeded client company (Solípse).
  server.get('/benchmark/solipse', async () => {
    const result = await runBenchmark(deps, SOLIPSE);
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
  return {
    repo: new InMemoryCompanyRepository(),
    reranker: new LocalCrossEncoderReranker(),
    judge: new LocalJudge(),
  };
}
