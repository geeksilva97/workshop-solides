import { test } from "node:test";
import assert from "node:assert/strict";
import {
  benchmarkSchema,
  type CohortFilters,
  diagnosticSchema,
  type Indicator,
  type PipelineStatus,
} from "@workshop/shared";
import { CLIENT_COMPANIES, CORPUS, generateCorpus } from "./data/companies.ts";
import { createFakeEmbedder, createFakeReranker } from "./fakes.ts";
import {
  buildQuery,
  buildSteps,
  originFromSources,
  progressPercent,
  runBenchmark,
  setorMatches,
} from "./pipeline.ts";

const ALL_INDICATORS = [
  "turnover_voluntario",
  "turnover_involuntario",
  "absenteismo",
  "time_to_hire",
  "enps",
  "cost_per_hire",
  "tenure_medio",
] as const satisfies readonly Indicator[];

const techFilters: CohortFilters = {
  setor: "Tecnologia",
  porte: "100–500",
  regiao: "Sudeste",
};

const solipse = CLIENT_COMPANIES[0]!;

const baseInput = () => ({
  benchmarkId: "bm-test",
  client: solipse,
  corpus: CORPUS,
  filters: techFilters,
  indicators: ALL_INDICATORS,
  embedder: createFakeEmbedder(),
  reranker: createFakeReranker(),
  createdAt: "2026-06-12T00:00:00.000Z",
});

// --- pure helpers ----------------------------------------------------------

test("buildQuery combines the client profile with the filters", () => {
  const query = buildQuery(solipse, techFilters);
  assert.ok(query.includes(solipse.description));
  assert.ok(query.includes("Setor Tecnologia"));
  assert.ok(query.includes("porte 100–500"));
  assert.ok(query.includes("região Sudeste"));
});

test("setorMatches accepts exact and CNAE-labelled sectors", () => {
  assert.equal(setorMatches("Tecnologia", "Tecnologia"), true);
  assert.equal(setorMatches("Tecnologia / Software (J-62)", "Tecnologia"), true);
  assert.equal(setorMatches("Saúde (Q-86)", "Saúde"), true);
  assert.equal(setorMatches("Indústria (C)", "Tecnologia"), false);
});

test("originFromSources maps retrieval arms to the cohort origin", () => {
  assert.equal(originFromSources(["dense", "bm25"]), "ambos");
  assert.equal(originFromSources(["dense"]), "dense");
  assert.equal(originFromSources(["bm25"]), "bm25");
  assert.equal(originFromSources([]), "dense");
});

test("buildSteps marks done/active/pending around the active stage", () => {
  const steps = buildSteps(2, false);
  assert.equal(steps.length, 7);
  assert.equal(steps[0]!.status, "done");
  assert.equal(steps[1]!.status, "done");
  assert.equal(steps[2]!.status, "active");
  assert.equal(steps[3]!.status, "pending");
  assert.equal(steps[2]!.stage, "bm25");
  assert.equal(steps[0]!.detail, "");
});

test("buildSteps marks every stage done when finished", () => {
  for (const step of buildSteps(0, true)) {
    assert.equal(step.status, "done");
  }
});

test("progressPercent advances by completed stages and pins to 100 when done", () => {
  assert.equal(progressPercent(0, false), 0);
  assert.equal(progressPercent(3, false), 43); // round(3/7 * 100)
  assert.equal(progressPercent(6, false), 86); // round(6/7 * 100)
  assert.equal(progressPercent(2, true), 100);
});

// --- end to end with fakes -------------------------------------------------

test("runBenchmark produces a schema-valid benchmark and diagnostic", async () => {
  const { benchmark, diagnostic } = await runBenchmark(baseInput());
  assert.doesNotThrow(() => benchmarkSchema.parse(benchmark));
  assert.doesNotThrow(() => diagnosticSchema.parse(diagnostic));
  assert.equal(benchmark.id, "bm-test");
  assert.equal(benchmark.status, "done");
  assert.equal(benchmark.companyName, solipse.name);
  assert.equal(diagnostic.benchmarkId, "bm-test");
});

test("the cohort respects the size and the requested sector", async () => {
  const { benchmark } = await runBenchmark(baseInput());
  assert.equal(benchmark.cohort.size, 10);
  assert.equal(benchmark.cohort.companies.length, 10);
  for (const company of benchmark.cohort.companies) {
    assert.equal(company.setor, "Tecnologia");
    assert.ok(company.similaridade >= 0 && company.similaridade <= 1);
  }
  // ranks are 1..n in order
  assert.deepEqual(
    benchmark.cohort.companies.map((c) => c.rank),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  // kAnonimato mirrors the cohort size; scoreMedio is the mean similarity.
  assert.equal(benchmark.cohort.kAnonimato, benchmark.cohort.size);
  const meanSimilarity =
    benchmark.cohort.companies.reduce((sum, c) => sum + c.similaridade, 0) /
    benchmark.cohort.companies.length;
  assert.ok(Math.abs(benchmark.cohort.scoreMedio - meanSimilarity) <= 1e-12);
  // origin reflects the retrieval arms; same-sector peers surface in both,
  // so at least one cohort member is "ambos".
  for (const company of benchmark.cohort.companies) {
    assert.ok(["dense", "bm25", "ambos"].includes(company.origem));
  }
  assert.ok(benchmark.cohort.companies.some((c) => c.origem === "ambos"));
});

test("emits the message for each of the seven stages then the completion", async () => {
  const messages: string[] = [];
  await runBenchmark({ ...baseInput(), onProgress: (s) => messages.push(s.message) });
  assert.deepEqual(messages, [
    "Validando perfil e montando a consulta",
    "Gerando embeddings e buscando por similaridade",
    "Busca léxica BM25",
    "Fundindo rankings (RRF)",
    "Reordenando com o reranker",
    "Calculando percentis vs. cohort",
    "Gerando diagnóstico",
    "Benchmark concluído",
  ]);
});

test("one KPI is produced per requested indicator", async () => {
  const { benchmark } = await runBenchmark({
    ...baseInput(),
    indicators: ["turnover_voluntario", "enps"],
  });
  assert.deepEqual(
    benchmark.kpis.map((k) => k.indicator),
    ["turnover_voluntario", "enps"],
  );
});

test("progress is reported for all seven stages, ending done at 100%", async () => {
  const statuses: PipelineStatus[] = [];
  await runBenchmark({ ...baseInput(), onProgress: (s) => statuses.push(s) });

  const first = statuses[0]!;
  assert.equal(first.steps[0]!.stage, "ingestao");
  assert.equal(first.steps[0]!.status, "active");
  assert.equal(first.percent, 0);

  const last = statuses.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.percent, 100);
  assert.ok(last.steps.every((s) => s.status === "done"));
  assert.ok(statuses.some((s) => s.steps.some((step) => step.stage === "reranker" && step.status === "active")));
});

test("runBenchmark enforces k-anonymity when the pool is too small", async () => {
  // Three companies across three sectors -> at most a 3-company cohort.
  await assert.rejects(
    () =>
      runBenchmark({
        ...baseInput(),
        corpus: generateCorpus(3),
      }),
    /k-anonymity/,
  );
});
