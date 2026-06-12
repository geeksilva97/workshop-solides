/**
 * Ollama-backed Embedder and Reranker.
 *
 * Embeddings: POST /api/embed with the qwen embedding model -> { embeddings }.
 * Reranking: Qwen3-Reranker is a yes/no relevance model. We feed its native
 * prompt format and read the first token's logprobs; the relevance score is
 * P(yes) = sigmoid(logprob(yes) - logprob(no)). The HTTP shell is thin; the
 * prompt builder and the logprob -> score math are pure and unit-tested.
 */
import type { ScoredDoc } from "../types.ts";
import type { Embedder, RerankDocument, Reranker } from "../ports.ts";

export const DEFAULT_OLLAMA_HOST = "http://localhost:11434";
export const DEFAULT_EMBED_MODEL = "qwen3-embedding:0.6b";
export const DEFAULT_RERANK_MODEL = "awenleven/Qwen3-Reranker-4B:Q4_K_M";
export const RERANK_INSTRUCT =
  "Given a company profile query, retrieve companies with a similar HR and business profile";

const RERANK_SYSTEM =
  'Judge whether the Document meets the requirements based on the Query and the Instruct provided. Note that the answer can only be "yes" or "no".';

/** Minimal response surface we rely on — lets tests pass a plain stub. */
export interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<FetchResponse>;

export interface OllamaOptions {
  readonly host?: string;
  readonly model?: string;
  readonly fetchImpl?: FetchLike;
}

export interface TopLogprob {
  readonly token: string;
  readonly logprob: number;
}

/** Build the Qwen3-Reranker prompt for a single query/document pair. */
export const buildRerankerPrompt = (
  query: string,
  document: string,
  instruct: string = RERANK_INSTRUCT,
): string =>
  `<|im_start|>system\n${RERANK_SYSTEM}<|im_end|>\n` +
  `<|im_start|>user\n<Instruct>: ${instruct}\n<Query>: ${query}\n<Document>: ${document}<|im_end|>\n` +
  `<|im_start|>assistant\n<think>\n\n</think>\n\n`;

/**
 * Relevance score in [0, 1] from the first token's candidate logprobs:
 * P(yes) = 1 / (1 + exp(logprob(no) - logprob(yes))). Missing "yes" -> 0,
 * missing "no" -> 1, neither -> 0.
 */
export const relevanceFromLogprobs = (
  candidates: readonly TopLogprob[],
): number => {
  let yesLogprob = -Infinity;
  let noLogprob = -Infinity;
  for (const candidate of candidates) {
    const token = candidate.token.trim().toLowerCase();
    if (token === "yes") yesLogprob = Math.max(yesLogprob, candidate.logprob);
    else if (token === "no") noLogprob = Math.max(noLogprob, candidate.logprob);
  }
  // IEEE handles the one-sided cases directly: only "no" -> exp(+inf) -> 0;
  // only "yes" -> exp(-inf) -> 1. With neither token present the difference is
  // (-inf) - (-inf) = NaN, which we map to 0 (no evidence -> not relevant).
  const score = 1 / (1 + Math.exp(noLogprob - yesLogprob));
  return Number.isNaN(score) ? 0 : score;
};

const resolveHost = (host?: string): string =>
  host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST;

const resolveFetch = (fetchImpl?: FetchLike): FetchLike =>
  fetchImpl ?? (fetch as unknown as FetchLike);

interface EmbedResponse {
  embeddings: number[][];
}

/** Create an Embedder backed by Ollama's /api/embed. */
export const createOllamaEmbedder = (options: OllamaOptions = {}): Embedder => {
  const host = resolveHost(options.host);
  const model = options.model ?? DEFAULT_EMBED_MODEL;
  const doFetch = resolveFetch(options.fetchImpl);

  return {
    async embed(texts) {
      const response = await doFetch(`${host}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, input: texts }),
      });
      if (!response.ok) {
        throw new Error(`Ollama embed failed: ${response.status}`);
      }
      const json = (await response.json()) as EmbedResponse;
      return json.embeddings;
    },
  };
};

interface GenerateResponse {
  logprobs?: ReadonlyArray<{ top_logprobs?: readonly TopLogprob[] }>;
}

/** Create a Reranker backed by Ollama running Qwen3-Reranker. */
export const createOllamaReranker = (options: OllamaOptions = {}): Reranker => {
  const host = resolveHost(options.host);
  const model = options.model ?? DEFAULT_RERANK_MODEL;
  const doFetch = resolveFetch(options.fetchImpl);

  const scoreDocument = async (
    query: string,
    document: RerankDocument,
  ): Promise<ScoredDoc> => {
    const response = await doFetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildRerankerPrompt(query, document.text),
        raw: true,
        stream: false,
        options: { num_predict: 1, temperature: 0 },
        logprobs: true,
        top_logprobs: 10,
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama rerank failed: ${response.status}`);
    }
    const json = (await response.json()) as GenerateResponse;
    const candidates = json.logprobs?.[0]?.top_logprobs ?? [];
    return { id: document.id, score: relevanceFromLogprobs(candidates) };
  };

  return {
    async rerank(query, documents) {
      const scored: ScoredDoc[] = [];
      for (const document of documents) {
        scored.push(await scoreDocument(query, document));
      }
      scored.sort((left, right) => right.score - left.score);
      return scored;
    },
  };
};
