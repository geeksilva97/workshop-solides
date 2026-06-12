import { z } from "zod";

export const trendDirectionEnum = z.enum(["up", "down", "stable"]);
export type TrendDirection = z.infer<typeof trendDirectionEnum>;

export const trendSeverityEnum = z.enum(["alta", "saudavel"]);
export type TrendSeverity = z.infer<typeof trendSeverityEnum>;

export const trendIndicatorSchema = z.object({
  label: z.string(),
  currentPercentile: z.number().int().min(0).max(100),
  priorPercentile: z.number().int().min(0).max(100),
  severity: trendSeverityEnum,
  /** "piorando" | "estável" | "melhorando" — free text status line. */
  statusText: z.string(),
  direction: trendDirectionEnum,
});
export type TrendIndicator = z.infer<typeof trendIndicatorSchema>;

export const trendsSchema = z.object({
  benchmarkId: z.string(),
  periods: z.array(z.string()),
  indicators: z.array(trendIndicatorSchema),
});
export type Trends = z.infer<typeof trendsSchema>;
