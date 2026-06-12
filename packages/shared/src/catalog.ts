import { z } from "zod";

/**
 * The selectable cohort filters offered by the "Novo benchmark" form. Derived
 * from the peer corpus (distinct sectors / sizes / regions) and served by the
 * API so the frontend never hardcodes options that the pipeline can't match.
 */
export const catalogSchema = z.object({
  setores: z.array(z.string()),
  portes: z.array(z.string()),
  regioes: z.array(z.string()),
});
export type Catalog = z.infer<typeof catalogSchema>;
