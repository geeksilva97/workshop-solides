import { type CompanyRepository, type Ranking, type Reranker, type SearchProfile } from '../ports.ts';
import { rrf } from './rrf.ts';

export type HybridConfig = {
  /** how many to pull from each retrieval leg before fusion */
  topN?: number;
  /** final cohort size after rerank */
  finalSize?: number;
  /** cross-encoder reranker; if absent, the fused ranking is returned as-is */
  reranker?: Reranker;
};

/**
 * The heart of retrieval, built across the live steps:
 *
 *   dense (prebuilt)  +  BM25 (step 02)  -> RRF fusion (step 03) -> rerank (step 04)
 *
 * Each step fills in the next line. Until then it throws at the first missing
 * piece - that is the live-build convention made literal.
 */
export async function hybridSearch(
  repo: CompanyRepository,
  profile: SearchProfile,
  config: HybridConfig = {},
): Promise<Ranking> {
  const topN = config.topN ?? 30;
  const finalSize = config.finalSize ?? 20;

  const dense = await repo.searchDense(profile, topN); // prebuilt
  const lexical = await repo.searchLexical(profile, topN); // step 02
  const fused = rrf([dense, lexical]).slice(0, topN); // step 03

  // step 04: rerank the fused finalists with a cross-encoder, then cut to finalSize
  if (!config.reranker) return fused.slice(0, finalSize);

  const candidates = await Promise.all(fused.map((f) => repo.getById(f.companyId)));
  const docs = candidates
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .map((c) => ({ id: c.id, text: c.description }));

  const reranked = await config.reranker.rerank(profile.description, docs);
  return reranked
    .slice(0, finalSize)
    .map((s, i) => ({ companyId: s.id, score: s.score, rank: i + 1 }));
}
