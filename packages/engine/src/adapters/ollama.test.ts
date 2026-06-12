import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EMBED_MODEL,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_RERANK_MODEL,
  type FetchLike,
  type TopLogprob,
  buildRerankerPrompt,
  createOllamaEmbedder,
  createOllamaReranker,
  relevanceFromLogprobs,
} from "./ollama.ts";

const closeTo = (actual: number, expected: number, eps = 1e-12): void => {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
};

test("buildRerankerPrompt embeds the query, document and yes/no constraint", () => {
  const prompt = buildRerankerPrompt("minha query", "meu documento");
  assert.ok(prompt.includes("<Query>: minha query"));
  assert.ok(prompt.includes("<Document>: meu documento"));
  assert.ok(prompt.includes('only be "yes" or "no"'));
  assert.ok(prompt.includes(RERANK_INSTRUCT_FRAGMENT));
  // The assistant turn must be primed so the model's first token is the answer.
  assert.ok(prompt.includes("<|im_start|>assistant"));
});
const RERANK_INSTRUCT_FRAGMENT = "<Instruct>: Given a company profile query";

test("relevanceFromLogprobs is P(yes) via the yes/no sigmoid", () => {
  const score = relevanceFromLogprobs([
    { token: "yes", logprob: -0.1 },
    { token: "no", logprob: -2.0 },
  ]);
  closeTo(score, 1 / (1 + Math.exp(-2.0 - -0.1)));
});

test("relevanceFromLogprobs normalizes token case and whitespace", () => {
  const score = relevanceFromLogprobs([
    { token: " Yes", logprob: -0.1 },
    { token: "NO", logprob: -2.0 },
  ]);
  closeTo(score, 1 / (1 + Math.exp(-2.0 - -0.1)));
});

test("relevanceFromLogprobs returns 1 when only yes is present", () => {
  assert.equal(relevanceFromLogprobs([{ token: "yes", logprob: -0.3 }]), 1);
});

test("relevanceFromLogprobs returns 0 when only no is present", () => {
  assert.equal(relevanceFromLogprobs([{ token: "no", logprob: -0.3 }]), 0);
});

test("relevanceFromLogprobs returns 0 when neither token is present", () => {
  assert.equal(relevanceFromLogprobs([{ token: "maybe", logprob: -0.3 }]), 0);
});

test("relevanceFromLogprobs ignores tokens that are neither yes nor no", () => {
  // A high-probability "maybe" must not be mistaken for a "no".
  assert.equal(
    relevanceFromLogprobs([
      { token: "yes", logprob: -0.1 },
      { token: "maybe", logprob: -0.05 },
    ]),
    1,
  );
});

test("relevanceFromLogprobs picks the best logprob per token", () => {
  const score = relevanceFromLogprobs([
    { token: "yes", logprob: -3.0 },
    { token: "yes", logprob: -0.1 }, // higher -> should win
    { token: "no", logprob: -2.0 },
  ]);
  closeTo(score, 1 / (1 + Math.exp(-2.0 - -0.1)));
});

// --- HTTP shell, exercised with a stub fetch -------------------------------

const okJson = (payload: unknown): ReturnType<FetchLike> =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payload) });

test("OllamaEmbedder posts to /api/embed and returns the embeddings", async () => {
  let capturedUrl = "";
  let capturedInit: { method?: string; headers?: Record<string, string>; body?: string } = {};
  const fetchImpl: FetchLike = (url, init) => {
    capturedUrl = url;
    capturedInit = init!;
    return okJson({ embeddings: [[1, 2, 3], [4, 5, 6]] });
  };
  const embedder = createOllamaEmbedder({
    host: "http://test:11434",
    model: "embed-x",
    fetchImpl,
  });

  const result = await embedder.embed(["a", "b"]);

  assert.equal(capturedUrl, "http://test:11434/api/embed");
  assert.equal(capturedInit.method, "POST");
  assert.equal(capturedInit.headers!["content-type"], "application/json");
  const capturedBody = JSON.parse(capturedInit.body!) as { model: string; input: string[] };
  assert.equal(capturedBody.model, "embed-x");
  assert.deepEqual(capturedBody.input, ["a", "b"]);
  assert.deepEqual(result, [[1, 2, 3], [4, 5, 6]]);
});

test("OllamaEmbedder falls back to the default host and model", async () => {
  let url = "";
  let model = "";
  const fetchImpl: FetchLike = (capturedUrl, init) => {
    url = capturedUrl;
    model = (JSON.parse(init!.body!) as { model: string }).model;
    return okJson({ embeddings: [[1]] });
  };
  await createOllamaEmbedder({ fetchImpl }).embed(["a"]);
  assert.equal(url, "http://localhost:11434/api/embed");
  assert.equal(model, "qwen3-embedding:0.6b");
  // Sanity: the literals above are the exported defaults.
  assert.equal(DEFAULT_OLLAMA_HOST, "http://localhost:11434");
  assert.equal(DEFAULT_EMBED_MODEL, "qwen3-embedding:0.6b");
});

test("OllamaReranker falls back to the default host and model", async () => {
  let url = "";
  let model = "";
  const fetchImpl: FetchLike = (capturedUrl, init) => {
    url = capturedUrl;
    model = (JSON.parse(init!.body!) as { model: string }).model;
    return okJson(logprobsFor([{ token: "yes", logprob: -0.1 }]));
  };
  await createOllamaReranker({ fetchImpl }).rerank("q", [{ id: "x", text: "t" }]);
  assert.equal(url, "http://localhost:11434/api/generate");
  assert.equal(model, "awenleven/Qwen3-Reranker-4B:Q4_K_M");
  assert.equal(DEFAULT_RERANK_MODEL, "awenleven/Qwen3-Reranker-4B:Q4_K_M");
});

test("OllamaEmbedder throws on a non-ok response", async () => {
  const fetchImpl: FetchLike = () =>
    Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
  const embedder = createOllamaEmbedder({ fetchImpl });
  await assert.rejects(() => embedder.embed(["a"]), /embed failed: 500/);
});

const logprobsFor = (candidates: TopLogprob[]) => ({
  logprobs: [{ top_logprobs: candidates }],
});

test("OllamaReranker scores each document and sorts best first", async () => {
  const fetchImpl: FetchLike = (_url, init) => {
    const body = JSON.parse(init!.body!) as { prompt: string };
    const candidates: TopLogprob[] = body.prompt.includes("strongmatch")
      ? [{ token: "yes", logprob: -0.1 }, { token: "no", logprob: -4 }]
      : [{ token: "no", logprob: -0.1 }, { token: "yes", logprob: -4 }];
    return okJson(logprobsFor(candidates));
  };
  const reranker = createOllamaReranker({ fetchImpl });

  const ranked = await reranker.rerank("q", [
    { id: "low", text: "weakother" },
    { id: "high", text: "strongmatch" },
  ]);

  assert.deepEqual(ranked.map((r) => r.id), ["high", "low"]);
  assert.ok(ranked[0]!.score > ranked[1]!.score);
});

test("OllamaReranker sends the documented generate options", async () => {
  let body: Record<string, unknown> = {};
  let url = "";
  let init: { method?: string; headers?: Record<string, string>; body?: string } = {};
  const fetchImpl: FetchLike = (capturedUrl, capturedInit) => {
    url = capturedUrl;
    init = capturedInit!;
    body = JSON.parse(capturedInit!.body!);
    return okJson(logprobsFor([{ token: "yes", logprob: -0.1 }, { token: "no", logprob: -2 }]));
  };
  const reranker = createOllamaReranker({ host: "http://test:11434", model: "rr", fetchImpl });

  await reranker.rerank("q", [{ id: "x", text: "t" }]);

  assert.equal(url, "http://test:11434/api/generate");
  assert.equal(init.method, "POST");
  assert.equal(init.headers!["content-type"], "application/json");
  assert.equal(body.model, "rr");
  assert.equal(body.raw, true);
  assert.equal(body.stream, false);
  assert.equal(body.logprobs, true);
  assert.equal(body.top_logprobs, 10);
  assert.deepEqual(body.options, { num_predict: 1, temperature: 0 });
});

test("OllamaReranker treats missing logprobs as score 0", async () => {
  const fetchImpl: FetchLike = () => okJson({});
  const reranker = createOllamaReranker({ fetchImpl });
  const ranked = await reranker.rerank("q", [{ id: "x", text: "t" }]);
  assert.equal(ranked[0]!.score, 0);
});

test("OllamaReranker handles an empty logprobs array without throwing", async () => {
  const fetchImpl: FetchLike = () => okJson({ logprobs: [] });
  const reranker = createOllamaReranker({ fetchImpl });
  const ranked = await reranker.rerank("q", [{ id: "x", text: "t" }]);
  assert.equal(ranked[0]!.score, 0);
});

test("OllamaReranker throws on a non-ok response", async () => {
  const fetchImpl: FetchLike = () =>
    Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  const reranker = createOllamaReranker({ fetchImpl });
  await assert.rejects(
    () => reranker.rerank("q", [{ id: "x", text: "t" }]),
    /rerank failed: 404/,
  );
});
