import type { Reranker, Scored } from '../../application/ports.ts';
import { tokenize } from '../lexical/bm25.ts';

/**
 * Local stand-in for a cross-encoder reranker.
 *
 * A real cross-encoder (Cohere Rerank, BGE-reranker-v2) reads the (query, doc)
 * pair together with full attention and returns a relevance score. Without an
 * API key, this scores each pair by token Jaccard overlap - deterministic, and
 * enough to demonstrate reordering and the port boundary. Swap this adapter for
 * `CohereReranker` in production; nothing in `application` changes.
 */
export class LocalCrossEncoderReranker implements Reranker {
  async rerank(query: string, docs: { id: string; text: string }[]): Promise<Scored[]> {
    const q = new Set(tokenize(query));

    return docs
      .map((d) => {
        const terms = new Set(tokenize(d.text));
        let inter = 0;
        for (const t of q) if (terms.has(t)) inter++;
        const union = new Set([...q, ...terms]).size;
        return { id: d.id, score: union === 0 ? 0 : inter / union };
      })
      .sort((a, b) => b.score - a.score);
  }
}
