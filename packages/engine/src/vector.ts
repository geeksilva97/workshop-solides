/**
 * Dense retrieval over embedding vectors.
 *
 *   cosine(a, b) = (a · b) / (|a| * |b|)
 *
 * Embeddings produced by the Ollama qwen model are not guaranteed to be
 * unit-normalized, so we divide by the magnitudes rather than assuming a dot
 * product. A zero vector has no direction; its similarity is defined as 0.
 */

import type { ScoredDoc } from "./types.ts";

export interface EmbeddedDoc {
  readonly id: string;
  readonly embedding: readonly number[];
}

/** Dot product of two equal-length vectors. */
export const dot = (a: readonly number[], b: readonly number[]): number => {
  if (a.length !== b.length) {
    throw new Error(
      `vector length mismatch: ${a.length} !== ${b.length}`,
    );
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
};

/** Euclidean magnitude (L2 norm) of a vector. */
export const magnitude = (vector: readonly number[]): number => {
  let sum = 0;
  for (const value of vector) {
    sum += value * value;
  }
  return Math.sqrt(sum);
};

/** Cosine similarity in [-1, 1]; 0 when either vector is all zeros. */
export const cosineSimilarity = (
  a: readonly number[],
  b: readonly number[],
): number => {
  // TODO (run/02): cosseno = dot(a,b) / (|a|·|b|); devolva 0 se algum vetor é nulo.
  // Dica: use `dot` e `magnitude`.
  throw new Error("TODO: implemente cosineSimilarity — ver docs/WORKSHOP.md");
};

/**
 * Rank documents by cosine similarity to `query`, highest first. Ties keep the
 * input order (stable sort).
 */
export const denseRank = (
  query: readonly number[],
  docs: readonly EmbeddedDoc[],
): ScoredDoc[] => {
  // TODO (run/02): ranqueie os docs por similaridade de cosseno (maior primeiro).
  throw new Error("TODO: implemente denseRank — ver docs/WORKSHOP.md");
};
