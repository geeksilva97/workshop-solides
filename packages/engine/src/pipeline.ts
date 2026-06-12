/**
 * The benchmark pipeline: ties retrieval, fusion, reranking, percentiles and
 * the diagnostic into one run, emitting progress for the seven pipeline stages
 * as it goes. Ollama access is injected via the Embedder/Reranker ports, so the
 * whole pipeline runs deterministically against fakes in tests.
 */
import type {
  Benchmark,
  Cohort,
  CohortCompany,
  CohortFilters,
  CohortOrigin,
  Diagnostic,
  Indicator,
  KpiResult,
  PipelineStatus,
  PipelineStep,
} from "@workshop/shared";
import { PIPELINE_STAGE_LABELS, pipelineStageEnum } from "@workshop/shared";
import type { CompanyRecord } from "./data/companies.ts";
import type { Embedder, Reranker } from "./ports.ts";
import { buildBm25Index, searchBm25 } from "./bm25.ts";
import { denseRank } from "./vector.ts";
import { reciprocalRankFusion } from "./rrf.ts";
import { assertKAnonymity, quantile } from "./percentiles.ts";
import { type IndicatorMeasurement, buildKpiResult } from "./indicators.ts";
import { buildDiagnostic } from "./report.ts";
import { clamp, mean } from "./math.ts";

const STAGES = pipelineStageEnum.options;
const DENSE_LIST = "dense";
const BM25_LIST = "bm25";

/** Tuning knobs; defaults sized for the ~120-company synthetic corpus. */
export interface PipelineOptions {
  readonly denseTopN: number;
  readonly bm25TopN: number;
  readonly rerankTopN: number;
  readonly cohortSize: number;
  /**
   * Optional pause (ms) after each stage's progress is emitted. Does not touch
   * the computation — it only spaces out the progress updates so the live
   * progress UI is observable on machines where the pipeline finishes in well
   * under a second. Defaults to 0 (no pacing).
   */
  readonly stageDelayMs: number;
}

export const DEFAULT_PIPELINE_OPTIONS: PipelineOptions = {
  denseTopN: 50,
  bm25TopN: 50,
  rerankTopN: 20,
  cohortSize: 10,
  stageDelayMs: 0,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface RunBenchmarkInput {
  readonly benchmarkId: string;
  readonly client: CompanyRecord;
  readonly corpus: readonly CompanyRecord[];
  readonly filters: CohortFilters;
  readonly indicators: readonly Indicator[];
  readonly embedder: Embedder;
  readonly reranker: Reranker;
  /** ISO timestamp; injected so a run is reproducible. */
  readonly createdAt: string;
  readonly onProgress?: (status: PipelineStatus) => void;
  readonly options?: Partial<PipelineOptions>;
}

export interface RunBenchmarkResult {
  readonly benchmark: Benchmark;
  readonly diagnostic: Diagnostic;
}

/** The text query used for both retrieval arms. */
export const buildQuery = (
  client: CompanyRecord,
  filters: CohortFilters,
): string =>
  `${client.description} Setor ${filters.setor}, porte ${filters.porte}, região ${filters.regiao}.`;

/** Which retrieval arm(s) surfaced a document -> the shared CohortOrigin. */
export const originFromSources = (
  sources: readonly string[],
): CohortOrigin => {
  const hasDense = sources.includes(DENSE_LIST);
  const hasBm25 = sources.includes(BM25_LIST);
  if (hasDense && hasBm25) return "ambos";
  return hasBm25 ? "bm25" : "dense";
};

/** Build the 7-stage step list with the given stage marked active (or all done). */
export const buildSteps = (
  activeIndex: number,
  done: boolean,
): PipelineStep[] =>
  STAGES.map((stage, index) => ({
    stage,
    label: PIPELINE_STAGE_LABELS[stage],
    status: done || index < activeIndex ? "done" : index === activeIndex ? "active" : "pending",
    detail: "",
  }));

/** Progress percent: completed stages out of seven (100 once done). */
export const progressPercent = (activeIndex: number, done: boolean): number =>
  done ? 100 : Math.round((activeIndex / STAGES.length) * 100);

const cohortValues = (
  cohort: readonly CompanyRecord[],
  indicator: Indicator,
): number[] => cohort.map((company) => company.indicators[indicator]);

/**
 * Whether a corpus company's sector matches the requested filter. The UI sends
 * CNAE-labelled values ("Tecnologia / Software (J-62)") while the corpus stores
 * the bare sector ("Tecnologia"), so we accept an exact match or the corpus
 * sector being contained in the filter label.
 */
export const setorMatches = (
  filterSetor: string,
  companySetor: string,
): boolean =>
  filterSetor === companySetor ||
  filterSetor.toLowerCase().includes(companySetor.toLowerCase());

/** Restrict the corpus to the requested sector when that still leaves a cohort. */
const candidatePool = (
  corpus: readonly CompanyRecord[],
  filters: CohortFilters,
  cohortSize: number,
): readonly CompanyRecord[] => {
  const sameSector = corpus.filter((c) => setorMatches(filters.setor, c.setor));
  return sameSector.length >= cohortSize ? sameSector : corpus;
};

/** Run the full benchmark pipeline for one client company. */
export const runBenchmark = async (
  input: RunBenchmarkInput,
): Promise<RunBenchmarkResult> => {
  const options = { ...DEFAULT_PIPELINE_OPTIONS, ...input.options };
  const emit = async (
    activeIndex: number,
    message: string,
    done = false,
  ): Promise<void> => {
    input.onProgress?.({
      benchmarkId: input.benchmarkId,
      percent: progressPercent(activeIndex, done),
      message,
      done,
      steps: buildSteps(activeIndex, done),
    });
    if (!done && options.stageDelayMs > 0) await sleep(options.stageDelayMs);
  };

  // 1. Ingestão
  await emit(0, "Validando perfil e montando a consulta");
  const pool = candidatePool(input.corpus, input.filters, options.cohortSize);
  const query = buildQuery(input.client, input.filters);
  const byId = new Map(pool.map((company) => [company.id, company]));

  // 2. Dense retrieval
  await emit(1, "Gerando embeddings e buscando por similaridade");
  const vectors = await input.embedder.embed([
    query,
    ...pool.map((company) => company.description),
  ]);
  const queryVector = vectors[0]!;
  const denseRanked = denseRank(
    queryVector,
    pool.map((company, index) => ({
      id: company.id,
      embedding: vectors[index + 1]!,
    })),
  );
  const denseList = {
    name: DENSE_LIST,
    ids: denseRanked.slice(0, options.denseTopN).map((d) => d.id),
  };

  // 3. BM25
  await emit(2, "Busca léxica BM25");
  const index = buildBm25Index(
    pool.map((company) => ({ id: company.id, text: company.description })),
  );
  const bm25List = {
    name: BM25_LIST,
    ids: searchBm25(index, query)
      .filter((d) => d.score > 0)
      .slice(0, options.bm25TopN)
      .map((d) => d.id),
  };

  // 4. RRF
  await emit(3, "Fundindo rankings (RRF)");
  const fused = reciprocalRankFusion([denseList, bm25List]);
  const sourcesById = new Map(fused.map((d) => [d.id, d.sources]));
  const rerankCandidates = fused.slice(0, options.rerankTopN);

  // 5. Reranker
  await emit(4, "Reordenando com o reranker");
  const reranked = await input.reranker.rerank(
    query,
    rerankCandidates.map((d) => ({ id: d.id, text: byId.get(d.id)!.description })),
  );
  const cohortScored = reranked.slice(0, options.cohortSize);
  assertKAnonymity(cohortScored.length);
  const cohortRecords = cohortScored.map((d) => byId.get(d.id)!);

  // 6. Percentis
  await emit(5, "Calculando percentis vs. cohort");
  const companies: CohortCompany[] = cohortScored.map((scored, position) => {
    const record = byId.get(scored.id)!;
    return {
      rank: position + 1,
      anonymizedName: record.anonymizedName,
      setor: record.setor,
      porte: record.porte,
      uf: record.uf,
      origem: originFromSources(sourcesById.get(scored.id) ?? []),
      similaridade: clamp(scored.score, 0, 1),
    };
  });
  const cohort: Cohort = {
    filters: input.filters,
    size: companies.length,
    scoreMedio: clamp(mean(companies.map((c) => c.similaridade)), 0, 1),
    kAnonimato: companies.length,
    companies,
  };
  const measurements: IndicatorMeasurement[] = input.indicators.map(
    (indicator) => {
      const values = cohortValues(cohortRecords, indicator);
      return {
        indicator,
        value: input.client.indicators[indicator],
        cohort: values,
        median: quantile(values, 0.5),
      };
    },
  );
  const kpis: KpiResult[] = measurements.map(buildKpiResult);

  // 7. Diagnóstico
  await emit(6, "Gerando diagnóstico");
  const diagnostic = buildDiagnostic({
    benchmarkId: input.benchmarkId,
    companyName: input.client.name,
    measurements,
    updatedAt: input.createdAt,
  });

  await emit(STAGES.length, "Benchmark concluído", true);

  const benchmark: Benchmark = {
    id: input.benchmarkId,
    companyName: input.client.name,
    status: "done",
    createdAt: input.createdAt,
    headline: diagnostic.headline,
    summary: diagnostic.summary,
    cohort,
    kpis,
  };

  return { benchmark, diagnostic };
};
