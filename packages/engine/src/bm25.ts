/**
 * Okapi BM25 lexical ranking.
 *
 *   IDF(term)        = log( (N - df + 0.5) / (df + 0.5) + 1 )
 *   TFnorm(term,doc) = tf * (k1 + 1) / ( tf + k1 * (1 - b + b * |doc| / avgdl) )
 *   BM25(query,doc)  = Σ IDF(term) * TFnorm(term, doc)   over query terms
 *
 * Defaults follow the reference material: k1 = 1.2, b = 0.75.
 */

/** Default term-frequency saturation. */
export const BM25_K1 = 1.2;
/** Default document-length normalization weight. */
export const BM25_B = 0.75;

/**
 * A light pt-BR stopword list — high-frequency tokens that carry no signal.
 * Kept as one space-separated literal so it reads as a single unit (and so a
 * mutation that blanks it is caught by the stopword tokenizer tests).
 * Accented forms ("à") are omitted: tokenize strips accents before lookup.
 */
const STOPWORDS = new Set(
  "a o as os um uma uns umas de do da dos das e ou em no na nos nas por para com que se ao aos mais mas como the".split(
    " ",
  ),
);

import type { ScoredDoc } from "./types.ts";

export interface Bm25Doc {
  readonly id: string;
  readonly text: string;
}

interface IndexedDoc {
  readonly id: string;
  readonly length: number;
  readonly tf: ReadonlyMap<string, number>;
}

export interface Bm25Index {
  readonly docs: readonly IndexedDoc[];
  readonly df: ReadonlyMap<string, number>;
  readonly n: number;
  readonly avgdl: number;
  readonly k1: number;
  readonly b: number;
}

/** Lowercase, strip accents and punctuation, split on whitespace, drop stopwords. */
export const tokenize = (text: string): string[] => {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const raw = normalized.split(/[^a-z0-9]+/);
  const tokens: string[] = [];
  for (const token of raw) {
    if (token.length === 0) continue;
    if (STOPWORDS.has(token)) continue;
    tokens.push(token);
  }
  return tokens;
};

const countTerms = (tokens: readonly string[]): Map<string, number> => {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
};

/** Build the BM25 statistics for a corpus. */
export const buildBm25Index = (
  docs: readonly Bm25Doc[],
  options: { k1?: number; b?: number } = {},
): Bm25Index => {
  const k1 = options.k1 ?? BM25_K1;
  const b = options.b ?? BM25_B;

  const indexed: IndexedDoc[] = [];
  const df = new Map<string, number>();
  let totalLength = 0;

  for (const doc of docs) {
    const tokens = tokenize(doc.text);
    const tf = countTerms(tokens);
    totalLength += tokens.length;
    for (const term of tf.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
    indexed.push({ id: doc.id, length: tokens.length, tf });
  }

  const n = indexed.length;
  const avgdl = n === 0 ? 0 : totalLength / n;
  return { docs: indexed, df, n, avgdl, k1, b };
};

/** Inverse document frequency of a term in the index. */
export const idf = (index: Bm25Index, term: string): number => {
  const df = index.df.get(term) ?? 0;
  return Math.log((index.n - df + 0.5) / (df + 0.5) + 1);
};

const scoreDoc = (
  index: Bm25Index,
  queryTerms: readonly string[],
  doc: IndexedDoc,
): number => {
  let score = 0;
  for (const term of queryTerms) {
    const tf = doc.tf.get(term);
    if (tf === undefined) continue;
    const denominator =
      tf + index.k1 * (1 - index.b + (index.b * doc.length) / index.avgdl);
    const tfNorm = (tf * (index.k1 + 1)) / denominator;
    score += idf(index, term) * tfNorm;
  }
  return score;
};

/**
 * Score every document against `query` and return them sorted by descending
 * score. Documents with no query-term overlap score 0 and sort last.
 */
export const searchBm25 = (index: Bm25Index, query: string): ScoredDoc[] => {
  const queryTerms = tokenize(query);
  const scored = index.docs.map((doc) => ({
    id: doc.id,
    score: scoreDoc(index, queryTerms, doc),
  }));
  scored.sort((left, right) => right.score - left.score);
  return scored;
};
