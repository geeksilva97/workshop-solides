/**
 * Ports the pipeline depends on. The Ollama adapters implement these for real;
 * the deterministic fakes in fakes.ts implement them for tests, so the pipeline
 * never needs a live model to be exercised.
 */
import type { ScoredDoc } from "./types.ts";

/** Turns text into dense embedding vectors. */
export interface Embedder {
  /** Embed a batch of texts; result[i] is the vector for texts[i]. */
  embed(texts: readonly string[]): Promise<number[][]>;
}

/** A candidate document for reranking. */
export interface RerankDocument {
  readonly id: string;
  readonly text: string;
}

/** Scores query/document pairs and returns them ranked, best first. */
export interface Reranker {
  rerank(
    query: string,
    documents: readonly RerankDocument[],
  ): Promise<ScoredDoc[]>;
}
