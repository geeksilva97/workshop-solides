import { z } from "zod";

/** The seven stages of the benchmark pipeline, in order. */
export const pipelineStageEnum = z.enum([
  "ingestao",
  "dense_retrieval",
  "bm25",
  "rrf",
  "reranker",
  "percentis",
  "diagnostico",
]);
export type PipelineStage = z.infer<typeof pipelineStageEnum>;

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  ingestao: "Ingestão",
  dense_retrieval: "Dense retrieval",
  bm25: "BM25",
  rrf: "RRF",
  reranker: "Reranker",
  percentis: "Cálculo de percentis",
  diagnostico: "Diagnóstico (LLM-as-judge)",
};

export const stageStatusEnum = z.enum(["done", "active", "pending"]);
export type StageStatus = z.infer<typeof stageStatusEnum>;

export const pipelineStepSchema = z.object({
  stage: pipelineStageEnum,
  label: z.string(),
  status: stageStatusEnum,
  detail: z.string(),
});
export type PipelineStep = z.infer<typeof pipelineStepSchema>;

export const pipelineStatusSchema = z.object({
  benchmarkId: z.string(),
  percent: z.number().int().min(0).max(100),
  message: z.string(),
  done: z.boolean(),
  steps: z.array(pipelineStepSchema),
});
export type PipelineStatus = z.infer<typeof pipelineStatusSchema>;
