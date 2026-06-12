/**
 * Deterministic test doubles for the Embedder and Reranker ports. Useful in the
 * engine's own pipeline tests and in the api's route tests, so neither needs a
 * live Ollama. Excluded from mutation testing (test infrastructure).
 */
import type { ScoredDoc } from "./types.ts";
import type { Embedder, RerankDocument, Reranker } from "./ports.ts";
import { tokenize } from "./bm25.ts";

const FAKE_DIM = 32;

const hashToken = (token: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash = Math.imul(hash ^ token.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) % FAKE_DIM;
};

/** A bag-of-words hashing embedding: similar text -> similar vector. */
export const fakeEmbedding = (text: string): number[] => {
  const vector = new Array<number>(FAKE_DIM).fill(0);
  for (const token of tokenize(text)) {
    vector[hashToken(token)] += 1;
  }
  return vector;
};

/** An Embedder that hashes tokens into a fixed-size vector. Deterministic. */
export const createFakeEmbedder = (): Embedder => ({
  embed: (texts) => Promise.resolve(texts.map(fakeEmbedding)),
});

/** Shared-token overlap between a query and a document. */
export const tokenOverlap = (query: string, document: string): number => {
  const queryTokens = new Set(tokenize(query));
  let shared = 0;
  for (const token of new Set(tokenize(document))) {
    if (queryTokens.has(token)) shared += 1;
  }
  return shared;
};

/** A Reranker that scores by lexical overlap. Deterministic, ranks best first. */
export const createFakeReranker = (): Reranker => ({
  rerank: (query, documents: readonly RerankDocument[]) => {
    const scored: ScoredDoc[] = documents.map((document) => ({
      id: document.id,
      score: tokenOverlap(query, document.text),
    }));
    scored.sort((left, right) => right.score - left.score);
    return Promise.resolve(scored);
  },
});
