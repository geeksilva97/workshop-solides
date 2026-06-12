import { z } from "zod";
import { cohortFiltersSchema, cohortSchema } from "./cohort.js";
import { indicatorEnum, kpiResultSchema } from "./kpi.js";

export const benchmarkStatusEnum = z.enum(["running", "done"]);
export type BenchmarkStatus = z.infer<typeof benchmarkStatusEnum>;

/** Payload sent from the "Novo benchmark" form. */
export const newBenchmarkSchema = z.object({
  companyId: z.string().min(1, "Selecione a empresa cliente"),
  filters: cohortFiltersSchema,
  indicators: z.array(indicatorEnum).min(1, "Selecione ao menos um indicador"),
});
export type NewBenchmarkInput = z.infer<typeof newBenchmarkSchema>;

/** Row shape for the "Seus benchmarks" list. */
export const benchmarkSummarySchema = z.object({
  id: z.string(),
  companyName: z.string(),
  status: benchmarkStatusEnum,
  createdAt: z.string(),
  headline: z.string(),
  criticalKpiCount: z.number().int(),
  trendingWorse: z.boolean(),
  cohortLabel: z.string(),
});
export type BenchmarkSummary = z.infer<typeof benchmarkSummarySchema>;

/** Full benchmark detail used by the results dashboard. */
export const benchmarkSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  status: benchmarkStatusEnum,
  createdAt: z.string(),
  headline: z.string(),
  summary: z.string(),
  cohort: cohortSchema,
  kpis: z.array(kpiResultSchema),
});
export type Benchmark = z.infer<typeof benchmarkSchema>;

export const benchmarkListSchema = z.array(benchmarkSummarySchema);

/** Selectable client companies for the "Novo benchmark" form. */
export const companyOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});
export type CompanyOption = z.infer<typeof companyOptionSchema>;
