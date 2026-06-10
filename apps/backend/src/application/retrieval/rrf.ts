import type { Ranking } from '../ports.ts';

/**
 * Reciprocal Rank Fusion - combine N rankings of the same set by POSITION, not
 * score (cosine and BM25 live on incomparable scales). Each item scores
 * `sum 1/(k + rank)` across the rankings it appears in; k=60 from the paper
 * attenuates the gap between top positions. Pure and deterministic.
 */
export function rrf(rankings: Ranking[], k = 60): Ranking {
  const score = new Map<string, number>();

  for (const ranking of rankings) {
    for (const entry of ranking) {
      score.set(entry.companyId, (score.get(entry.companyId) ?? 0) + 1 / (k + entry.rank));
    }
  }

  return [...score.entries()]
    .map(([companyId, s]) => ({ companyId, score: s }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ companyId: e.companyId, score: e.score, rank: i + 1 }));
}
