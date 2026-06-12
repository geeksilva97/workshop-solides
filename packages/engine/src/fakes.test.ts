import { test } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity } from "./vector.ts";
import {
  createFakeEmbedder,
  createFakeReranker,
  fakeEmbedding,
  tokenOverlap,
} from "./fakes.ts";

test("fakeEmbedding is deterministic", () => {
  assert.deepEqual(fakeEmbedding("empresa de tecnologia"), fakeEmbedding("empresa de tecnologia"));
});

test("similar text embeds closer than dissimilar text", () => {
  const query = fakeEmbedding("empresa de tecnologia b2b sao paulo");
  const similar = fakeEmbedding("empresa de tecnologia b2b em sao paulo");
  const different = fakeEmbedding("hospital de saude no para");
  assert.ok(cosineSimilarity(query, similar) > cosineSimilarity(query, different));
});

test("fake embedder embeds a batch positionally", async () => {
  const vectors = await createFakeEmbedder().embed(["a b", "c"]);
  assert.equal(vectors.length, 2);
  assert.deepEqual(vectors[0], fakeEmbedding("a b"));
});

test("tokenOverlap counts shared distinct tokens", () => {
  assert.equal(tokenOverlap("gato preto casa", "gato casa azul"), 2);
  assert.equal(tokenOverlap("gato", "cachorro"), 0);
});

test("fake reranker ranks by lexical overlap, best first", async () => {
  const ranked = await createFakeReranker().rerank("tecnologia b2b sao paulo", [
    { id: "weak", text: "saude para hospital" },
    { id: "strong", text: "tecnologia b2b sao paulo" },
  ]);
  assert.deepEqual(ranked.map((r) => r.id), ["strong", "weak"]);
  assert.ok(ranked[0]!.score > ranked[1]!.score);
});
