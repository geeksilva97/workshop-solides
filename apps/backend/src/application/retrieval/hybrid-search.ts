import { type CompanyRepository, type Ranking, type SearchProfile } from '../ports.ts';
import { rrf } from './rrf.ts';

export type HybridConfig = {
  /** how many to pull from each retrieval leg before fusion */
  topN?: number;
  /** final cohort size after rerank */
  finalSize?: number;
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

  const dense = await repo.searchDense(profile, topN); // prebuilt
  const lexical = await repo.searchLexical(profile, topN); // step 02

  const fused = rrf([dense, lexical]).slice(0, topN); // step 03
  // step 04: const reranked = await reranker.rerank(profile.description, docsOf(fused));
  return fused;
}
