import { z } from "zod";

/** Indicators tracked across a benchmark. */
export const indicatorEnum = z.enum([
  "turnover_voluntario",
  "turnover_involuntario",
  "absenteismo",
  "time_to_hire",
  "enps",
  "cost_per_hire",
  "tenure_medio",
]);
export type Indicator = z.infer<typeof indicatorEnum>;

/** Human label + unit for each indicator, shared by every screen. */
export const INDICATOR_LABELS: Record<Indicator, string> = {
  turnover_voluntario: "Turnover voluntário",
  turnover_involuntario: "Turnover involuntário",
  absenteismo: "Absenteísmo",
  time_to_hire: "Time-to-hire",
  enps: "eNPS",
  cost_per_hire: "Cost per hire",
  tenure_medio: "Tenure médio",
};

/** Whether a KPI is in a healthy band or an alert band. */
export const kpiStatusEnum = z.enum(["alta", "saudavel"]);
export type KpiStatus = z.infer<typeof kpiStatusEnum>;

export const kpiResultSchema = z.object({
  indicator: indicatorEnum,
  label: z.string(),
  value: z.number(),
  median: z.number(),
  unit: z.string(),
  percentile: z.number().int().min(0).max(100),
  status: kpiStatusEnum,
});
export type KpiResult = z.infer<typeof kpiResultSchema>;
