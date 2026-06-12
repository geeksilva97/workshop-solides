import { z } from "zod";

/** Where a peer company surfaced from in the hybrid retrieval pipeline. */
export const cohortOriginEnum = z.enum(["dense", "bm25", "ambos"]);
export type CohortOrigin = z.infer<typeof cohortOriginEnum>;

export const cohortFiltersSchema = z.object({
  setor: z.string(),
  porte: z.string(),
  regiao: z.string(),
});
export type CohortFilters = z.infer<typeof cohortFiltersSchema>;

export const cohortCompanySchema = z.object({
  rank: z.number().int().positive(),
  anonymizedName: z.string(),
  setor: z.string(),
  porte: z.string(),
  uf: z.string(),
  origem: cohortOriginEnum,
  similaridade: z.number().min(0).max(1),
});
export type CohortCompany = z.infer<typeof cohortCompanySchema>;

export const cohortSchema = z.object({
  filters: cohortFiltersSchema,
  size: z.number().int(),
  scoreMedio: z.number().min(0).max(1),
  kAnonimato: z.number().int(),
  companies: z.array(cohortCompanySchema),
});
export type Cohort = z.infer<typeof cohortSchema>;
