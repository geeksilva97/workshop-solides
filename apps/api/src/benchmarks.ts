/**
 * Benchmark service: kicks off the engine pipeline asynchronously, tracks live
 * per-run progress in memory, and persists results through the injected
 * repositories so benchmarks (and the history that powers real trends) survive
 * restarts.
 *
 * Ollama access (embedder/reranker), the corpus, the clock, the id factory and
 * the repositories are all injected so route tests run the real pipeline on
 * fakes + in-memory repos, with no live model and no database.
 */
import { randomUUID } from "node:crypto";
import type {
  Benchmark,
  BenchmarkSummary,
  Catalog,
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
  CORPUS,
  type CompanyRecord,
  type Embedder,
  type Reranker,
  buildSteps,
  catalogFromCorpus,
  createOllamaEmbedder,
  createOllamaReranker,
  runBenchmark,
} from "@workshop/engine";
import { createMemoryRepositories } from "./repositories/memory.ts";
import type { BenchmarkRepository, CompanyRepository } from "./repositories/types.ts";

export interface BenchmarkServiceDeps {
  readonly embedder?: Embedder;
  readonly reranker?: Reranker;
  readonly corpus?: readonly CompanyRecord[];
  readonly companies?: CompanyRepository;
  readonly benchmarks?: BenchmarkRepository;
  readonly now?: () => string;
  readonly idFactory?: () => string;
}

/** Raised when a benchmark is requested for an unknown client company. */
export class UnknownCompanyError extends Error {}

const cohortLabel = (input: NewBenchmarkInput): string =>
  `${input.filters.setor} · ${input.filters.porte} · ${input.filters.regiao}`;

const STATUS_TEXT: Record<TrendDirection, string> = {
  up: "Subiu vs. o período anterior",
  down: "Caiu vs. o período anterior",
  stable: "Estável vs. o período anterior",
};

const doneStatus = (id: string): PipelineStatus => ({
  benchmarkId: id,
  percent: 100,
  message: "Benchmark concluído",
  done: true,
  steps: buildSteps(0, true),
});

const failedStatus = (id: string, message: string): PipelineStatus => ({
  benchmarkId: id,
  percent: 100,
  message,
  done: true,
  steps: buildSteps(0, false),
});

const queuedStatus = (id: string): PipelineStatus => ({
  benchmarkId: id,
  percent: 0,
  message: "Na fila",
  done: false,
  steps: buildSteps(0, false),
});

/**
 * Derive a two-period trend view by comparing a finished benchmark against the
 * previous finished benchmark for the same company. When there is no prior run
 * the indicator is reported as the first measured period (stable, no change) —
 * nothing is synthesized.
 */
export const buildTrends = (
  benchmark: Benchmark,
  previous: Benchmark | undefined,
): Trends => {
  const priorByLabel = new Map(
    (previous?.kpis ?? []).map((kpi) => [kpi.label, kpi.percentile]),
  );
  const indicators: TrendIndicator[] = benchmark.kpis.map((kpi) => {
    const currentPercentile = kpi.percentile;
    const hasPrior = priorByLabel.has(kpi.label);
    const priorPercentile = priorByLabel.get(kpi.label) ?? currentPercentile;
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
      statusText: hasPrior ? STATUS_TEXT[direction] : "Primeiro período medido",
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
  listCompanies(): Promise<CompanyOption[]>;
  listCatalog(): Promise<Catalog>;
  listBenchmarks(userId: string): Promise<BenchmarkSummary[]>;
  createBenchmark(input: NewBenchmarkInput, userId: string): Promise<{ id: string }>;
  getStatus(id: string): Promise<PipelineStatus | undefined>;
  getBenchmark(id: string): Promise<Benchmark | undefined>;
  getCohort(id: string): Promise<Cohort | undefined>;
  getDiagnostic(id: string): Promise<Diagnostic | undefined>;
  getTrends(id: string): Promise<Trends | undefined>;
  /** Resolves when the benchmark's background run settles (for tests). */
  waitFor(id: string): Promise<void> | undefined;
}

export const createBenchmarkService = (
  deps: BenchmarkServiceDeps = {},
): BenchmarkService => {
  const embedder = deps.embedder ?? createOllamaEmbedder();
  const reranker = deps.reranker ?? createOllamaReranker();
  const corpus = deps.corpus ?? CORPUS;
  const now = deps.now ?? (() => new Date().toISOString());
  const idFactory = deps.idFactory ?? (() => randomUUID());
  const catalog = catalogFromCorpus(corpus);

  let companyRepo = deps.companies;
  let benchmarkRepo = deps.benchmarks;
  if (companyRepo === undefined || benchmarkRepo === undefined) {
    const repos = createMemoryRepositories();
    companyRepo ??= repos.companies;
    benchmarkRepo ??= repos.benchmarks;
  }
  const companies = companyRepo;
  const repo = benchmarkRepo;

  // Live progress for in-flight runs in this process; terminal state is derived
  // from the repository so a benchmark stays queryable after a restart.
  const liveStatus = new Map<string, PipelineStatus>();
  const completions = new Map<string, Promise<void>>();

  const createBenchmark = async (
    input: NewBenchmarkInput,
    userId: string,
  ): Promise<{ id: string }> => {
    const client = await companies.findById(input.companyId);
    if (client === undefined) {
      throw new UnknownCompanyError(`Empresa ${input.companyId} não encontrada`);
    }

    const id = idFactory();
    const createdAt = now();
    const label = cohortLabel(input);

    const summary: BenchmarkSummary = {
      id,
      companyName: client.name,
      status: "running",
      createdAt,
      headline: "Processando benchmark…",
      criticalKpiCount: 0,
      trendingWorse: false,
      cohortLabel: label,
    };
    await repo.insert({
      id,
      userId,
      companyId: input.companyId,
      createdAt,
      filters: input.filters,
      indicators: input.indicators,
      summary,
    });
    liveStatus.set(id, queuedStatus(id));

    const completion = runBenchmark({
      benchmarkId: id,
      client,
      corpus,
      filters: input.filters,
      indicators: input.indicators,
      embedder,
      reranker,
      createdAt,
      onProgress: (status) => {
        liveStatus.set(id, status);
      },
    })
      .then(async ({ benchmark, diagnostic }) => {
        await repo.complete(id, {
          benchmark,
          diagnostic,
          summary: {
            id,
            companyName: benchmark.companyName,
            status: "done",
            createdAt,
            headline: diagnostic.headline,
            criticalKpiCount: diagnostic.indicators.length,
            trendingWorse: diagnostic.indicators.length > 0,
            cohortLabel: label,
          },
        });
        liveStatus.set(id, doneStatus(id));
      })
      .catch(async (error: unknown) => {
        const message = `Falha ao processar: ${String(error)}`;
        await repo.markFailed(id, message);
        liveStatus.set(id, failedStatus(id, message));
      });
    completions.set(id, completion);

    return { id };
  };

  const getStatus = async (id: string): Promise<PipelineStatus | undefined> => {
    const live = liveStatus.get(id);
    if (live !== undefined) return live;
    const state = await repo.getState(id);
    if (state === undefined) return undefined;
    if (state.status === "done") return doneStatus(id);
    if (state.status === "failed") return failedStatus(id, state.summary.headline);
    return queuedStatus(id);
  };

  const getTrends = async (id: string): Promise<Trends | undefined> => {
    const benchmark = await repo.getBenchmark(id);
    if (benchmark === undefined) return undefined;
    const state = await repo.getState(id);
    const previous =
      state === undefined
        ? undefined
        : await repo.findPrevious(state.userId, state.companyId, state.createdAt);
    return buildTrends(benchmark, previous);
  };

  return {
    listCompanies: async () =>
      (await companies.list()).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
    listCatalog: async () => catalog,
    listBenchmarks: (userId) => repo.listByUser(userId),
    createBenchmark,
    getStatus,
    getBenchmark: (id) => repo.getBenchmark(id),
    getCohort: async (id) => (await repo.getBenchmark(id))?.cohort,
    getDiagnostic: (id) => repo.getDiagnostic(id),
    getTrends,
    waitFor: (id) => completions.get(id),
  };
};
