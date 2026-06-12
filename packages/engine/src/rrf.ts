/**
 * Reciprocal Rank Fusion — combine several ranked lists using rank position
 * only, never the underlying scores (which live on different scales).
 *
 *   RRF_score(item) = Σ_i 1 / (k + rank_i(item))   over lists containing item
 *
 * rank is 1-indexed; a list that does not contain the item contributes 0.
 * k = 60 follows the original paper (Cormack et al.) and dampens the gap
 * between top positions.
 */

/** Default RRF dampening constant. */
export const RRF_K = 60;

/** A named, ordered list of document ids (best first). */
export interface RankedList {
  readonly name: string;
  readonly ids: readonly string[];
}

export interface FusedDoc {
  readonly id: string;
  readonly score: number;
  /** Names of the lists this document appeared in, in input order. */
  readonly sources: readonly string[];
}

interface Accumulator {
  score: number;
  sources: string[];
}

/**
 * Fuse the given ranked lists. The result is sorted by descending RRF score;
 * ties keep the order in which documents were first encountered.
 */
export const reciprocalRankFusion = (
  lists: readonly RankedList[],
  k: number = RRF_K,
): FusedDoc[] => {
  const accumulators = new Map<string, Accumulator>();

  for (const list of lists) {
    for (let i = 0; i < list.ids.length; i++) {
      const id = list.ids[i]!;
      const rank = i + 1;
      const contribution = 1 / (k + rank);
      const existing = accumulators.get(id);
      if (existing === undefined) {
        accumulators.set(id, { score: contribution, sources: [list.name] });
      } else {
        existing.score += contribution;
        existing.sources.push(list.name);
      }
    }
  }

  const fused: FusedDoc[] = [];
  for (const [id, acc] of accumulators) {
    fused.push({ id, score: acc.score, sources: acc.sources });
  }
  fused.sort((left, right) => right.score - left.score);
  return fused;
};
