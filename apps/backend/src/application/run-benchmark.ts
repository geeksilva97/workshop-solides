import type { Company } from '../domain/company.ts';
import { Cohort } from '../domain/cohort.ts';
import type { Diagnostico } from '../domain/diagnostico.ts';
import { type CompanyRepository, type Judge, type Reranker, type SearchProfile } from './ports.ts';
import { hybridSearch } from './retrieval/hybrid-search.ts';
import { percentis, type KpiPercentile } from './percentis.ts';
import { gerarDiagnostico } from './gerar-diagnostico.ts';

export type BenchmarkDeps = {
  repo: CompanyRepository;
  reranker: Reranker;
  judge: Judge;
};

export type BenchmarkResult = {
  empresa: string;
  cohort: Company[];
  kpis: KpiPercentile[];
  diagnostico: Diagnostico;
};

function toProfile(c: Company): SearchProfile {
  return {
    description: c.description,
    sector: c.sector,
    region: c.region,
    size: c.size,
    tags: c.tags,
  };
}

/**
 * The whole agent in one function - the composition the workshop builds toward:
 *
 *   hybrid retrieval (dense + BM25 -> RRF -> rerank) -> Cohort (k-anonymity)
 *   -> percentiles -> LLM-as-judge -> diagnosis.
 *
 * Every step is the real one built across the live steps; only the adapters
 * (repo / reranker / judge) are swappable.
 */
export async function runBenchmark(deps: BenchmarkDeps, client: Company): Promise<BenchmarkResult> {
  const ranking = await hybridSearch(deps.repo, toProfile(client), {
    reranker: deps.reranker,
    finalSize: 20,
  });

  const found = await Promise.all(ranking.map((r) => deps.repo.getById(r.companyId)));
  const companies = found.filter((c): c is Company => c !== null);

  const cohort = Cohort.of(companies); // throws if k-anonymity is violated
  const kpis = percentis(client.kpis, cohort);
  const diagnostico = await gerarDiagnostico(deps.judge, {
    empresa: client.name,
    setor: client.sector,
    kpis,
  });

  return { empresa: client.name, cohort: companies, kpis, diagnostico };
}
