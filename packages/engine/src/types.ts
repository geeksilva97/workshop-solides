/** A document id paired with a relevance/similarity score. */
export interface ScoredDoc {
  readonly id: string;
  readonly score: number;
}
