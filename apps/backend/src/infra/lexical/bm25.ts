/**
 * BM25 lexical scoring - the algorithm behind the in-memory lexical search.
 *
 * In production this is delegated to Postgres full-text search (`to_tsvector` +
 * `ts_rank_cd`); here we implement BM25 directly so the reference run needs no
 * database and the formula is inspectable. Same idea: rare terms weigh more,
 * frequency saturates, long docs are penalized.
 */

export type LexDoc = { id: string; text: string };

const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'para', 'por', 'com',
  'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'que', 'the', 'of', 'and', 'for',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function bm25(
  query: string,
  docs: LexDoc[],
  k1 = 1.2,
  b = 0.75,
): { id: string; score: number }[] {
  const N = docs.length;
  const tokenized = docs.map((d) => ({ id: d.id, terms: tokenize(d.text) }));
  const avgdl = tokenized.reduce((sum, d) => sum + d.terms.length, 0) / Math.max(N, 1);

  // document frequency per term
  const df = new Map<string, number>();
  for (const d of tokenized) {
    for (const term of new Set(d.terms)) df.set(term, (df.get(term) ?? 0) + 1);
  }

  const idf = (term: string): number => {
    const n = df.get(term) ?? 0;
    return Math.log((N - n + 0.5) / (n + 0.5) + 1);
  };

  const qTerms = new Set(tokenize(query));

  return tokenized
    .map((d) => {
      const len = d.terms.length;
      const counts = new Map<string, number>();
      for (const term of d.terms) counts.set(term, (counts.get(term) ?? 0) + 1);

      let score = 0;
      for (const term of qTerms) {
        const tf = counts.get(term) ?? 0;
        if (tf === 0) continue;
        const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * len) / avgdl));
        score += idf(term) * tfNorm;
      }
      return { id: d.id, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}
