import { z } from "zod";

export const criticalIndicatorSchema = z.object({
  label: z.string(),
  value: z.number(),
  median: z.number(),
  unit: z.string(),
  percentile: z.number().int().min(0).max(100),
  status: z.enum(["alta", "critico", "saudavel"]),
});
export type CriticalIndicator = z.infer<typeof criticalIndicatorSchema>;

export const hypothesisSchema = z.object({
  order: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
});
export type Hypothesis = z.infer<typeof hypothesisSchema>;

export const diagnosticSchema = z.object({
  benchmarkId: z.string(),
  headline: z.string(),
  summary: z.string(),
  indicators: z.array(criticalIndicatorSchema),
  hypotheses: z.array(hypothesisSchema),
  nextAction: z.object({
    title: z.string(),
    description: z.string(),
    ctaLabel: z.string(),
  }),
  updatedAt: z.string(),
});
export type Diagnostic = z.infer<typeof diagnosticSchema>;
