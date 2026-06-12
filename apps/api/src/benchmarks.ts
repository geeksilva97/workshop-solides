/**
 * In-memory benchmark service: kicks off the engine pipeline asynchronously,
 * tracks per-benchmark progress, and exposes the results the routes serve.
 *
 * Ollama access (embedder/reranker), the corpus, the clock and the id factory
 * are all injected so route tests can run the real pipeline on fakes without a
 * live model or wall-clock nondeterminism.
 */
import { randomUUID } from "node:crypto";
import type {
  Benchmark,
  BenchmarkSummary,
  Cohort,
  CompanyOption,
  Diagnostic,
  NewBenchmarkInput,
  PipelineStatus,
  TrendDirection,
  TrendIndicator,
  Trends,
} from "@workshop/shared";
import {
  CLIENT_COMPANIES,
  CORPUS,
  type CompanyRecord,
  type Embedder,
  type Reranker,
  buildSteps,
  companyOptions,
  createOllamaEmbedder,
  createOllamaReranker,
  runBenchmark,
} from "@workshop/engine";

export interface BenchmarkServiceDeps {
  readonly embedder?: Embedder;
  readonly reranker?: Reranker;
  readonly corpus?: readonly CompanyRecord[];
  readonly clientCompanies?: readonly CompanyRecord[];
  readonly now?: () => string;
  readonly idFactory?: () => string;
}

/** Raised when a benchmark is requested for an unknown client company. */
export class UnknownCompanyError extends Error {}

interface Entry {
  summary: BenchmarkSummary;
  status: PipelineStatus;
  benchmark?: Benchmark;
  diagnostic?: Diagnostic;
  completion: Promise<void>;
}

const cohortLabel = (input: NewBenchmarkInput): string =>
  `${input.filters.setor} · ${input.filters.porte} · ${input.filters.regiao}`;

const STATUS_TEXT: Record<TrendDirection, string> = {
  up: "Subiu vs. o período anterior",
  down: "Caiu vs. o período anterior",
  stable: "Estável vs. o período anterior",
};

/**
 * Derive a two-period trend view from a finished benchmark. There is no real
 * history yet, so the prior period is synthesized deterministically from the
 * current percentile (one notch better), purely to populate the screen.
 */
export const buildTrends = (benchmark: Benchmark): Trends => {
  const indicators: TrendIndicator[] = benchmark.kpis.map((kpi) => {
    const currentPercentile = kpi.percentile;
    const priorPercentile = Math.max(0, currentPercentile - 7);
    const direction: TrendDirection =
      currentPercentile > priorPercentile
        ? "up"
        : currentPercentile < priorPercentile
          ? "down"
          : "stable";
    return {
      label: kpi.label,
      currentPercentile,
      priorPercentile,
      severity: kpi.status,
      statusText: STATUS_TEXT[direction],
      direction,
    };
  });
  return {
    benchmarkId: benchmark.id,
    periods: ["Período anterior", "Período atual"],
    indicators,
  };
};

export interface BenchmarkService {
  listCompanies(): CompanyOption[];
  listBenchmarks(): BenchmarkSummary[];
  createBenchmark(input: NewBenchmarkInput): { id: string };
  getStatus(id: string): PipelineStatus | undefined;
  getBenchmark(id: string): Benchmark | undefined;
  getCohort(id: string): Cohort | undefined;
  getDiagnostic(id: string): Diagnostic | undefined;
  getTrends(id: string): Trends | undefined;
  /** Resolves when the benchmark's background run settles (for tests). */
  waitFor(id: string): Promise<void> | undefined;
}

export const createBenchmarkService = (
  deps: BenchmarkServiceDeps = {},
): BenchmarkService => {
  const embedder = deps.embedder ?? createOllamaEmbedder();
  const reranker = deps.reranker ?? createOllamaReranker();
  const corpus = deps.corpus ?? CORPUS;
  const clients = deps.clientCompanies ?? CLIENT_COMPANIES;
  const now = deps.now ?? (() => new Date().toISOString());
  const idFactory = deps.idFactory ?? (() => randomUUID());

  const entries = new Map<string, Entry>();

  const findClient = (id: string): CompanyRecord | undefined =>
    clients.find((c) => c.id === id);

  const createBenchmark = (input: NewBenchmarkInput): { id: string } => {
    const client = findClient(input.companyId);
    if (client === undefined) {
      throw new UnknownCompanyError(`Empresa ${input.companyId} não encontrada`);
    }

    const id = idFactory();
    const createdAt = now();
    const label = cohortLabel(input);

    const entry: Entry = {
      summary: {
        id,
        companyName: client.name,
        status: "running",
        createdAt,
        headline: "Processando benchmark…",
        criticalKpiCount: 0,
        trendingWorse: false,
        cohortLabel: label,
      },
      status: {
        benchmarkId: id,
        percent: 0,
        message: "Na fila",
        done: false,
        steps: buildSteps(0, false),
      },
      completion: Promise.resolve(),
    };
    entries.set(id, entry);

    entry.completion = runBenchmark({
      benchmarkId: id,
      client,
      corpus,
      filters: input.filters,
      indicators: input.indicators,
      embedder,
      reranker,
      createdAt,
      onProgress: (status) => {
        entry.status = status;
      },
    })
      .then(({ benchmark, diagnostic }) => {
        entry.benchmark = benchmark;
        entry.diagnostic = diagnostic;
        entry.summary = {
          id,
          companyName: benchmark.companyName,
          status: "done",
          createdAt,
          headline: diagnostic.headline,
          criticalKpiCount: diagnostic.indicators.length,
          trendingWorse: diagnostic.indicators.length > 0,
          cohortLabel: label,
        };
      })
      .catch((error: unknown) => {
        entry.status = {
          benchmarkId: id,
          percent: 100,
          message: `Falha ao processar: ${String(error)}`,
          done: true,
          steps: buildSteps(0, false),
        };
      });

    return { id };
  };

  return {
    listCompanies: () => companyOptions(),
    listBenchmarks: () =>
      [...entries.values()].map((entry) => entry.summary),
    createBenchmark,
    getStatus: (id) => entries.get(id)?.status,
    getBenchmark: (id) => entries.get(id)?.benchmark,
    getCohort: (id) => entries.get(id)?.benchmark?.cohort,
    getDiagnostic: (id) => entries.get(id)?.diagnostic,
    getTrends: (id) => {
      const benchmark = entries.get(id)?.benchmark;
      return benchmark === undefined ? undefined : buildTrends(benchmark);
    },
    waitFor: (id) => entries.get(id)?.completion,
  };
};
