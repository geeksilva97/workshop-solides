import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BM25_B,
  BM25_K1,
  buildBm25Index,
  idf,
  searchBm25,
  tokenize,
} from "./bm25.ts";

const closeTo = (actual: number, expected: number, eps = 1e-12): void => {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
};

test("default parameters follow the reference material", () => {
  assert.equal(BM25_K1, 1.2);
  assert.equal(BM25_B, 0.75);
});

test("tokenize lowercases, strips accents and punctuation", () => {
  assert.deepEqual(tokenize("Indústria, Software!"), ["industria", "software"]);
});

test("tokenize drops pt-BR stopwords and empties", () => {
  assert.deepEqual(tokenize("o gato e a casa de pedra"), [
    "gato",
    "casa",
    "pedra",
  ]);
});

test("tokenize keeps alphanumeric tokens like b2b", () => {
  assert.deepEqual(tokenize("SaaS B2B"), ["saas", "b2b"]);
});

// Corpus reused across the scoring assertions:
//   d1 "gato preto"        -> len 2
//   d2 "gato branco gato"  -> len 3, tf(gato)=2
//   d3 "cachorro"          -> len 1
// N = 3, avgdl = 2, df(gato)=2, df(preto)=df(branco)=df(cachorro)=1
const corpus = [
  { id: "d1", text: "gato preto" },
  { id: "d2", text: "gato branco gato" },
  { id: "d3", text: "cachorro" },
];

test("buildBm25Index computes N, avgdl and df", () => {
  const index = buildBm25Index(corpus);
  assert.equal(index.n, 3);
  assert.equal(index.avgdl, 2);
  assert.equal(index.df.get("gato"), 2);
  assert.equal(index.df.get("preto"), 1);
  assert.equal(index.df.get("cachorro"), 1);
});

test("avgdl of an empty corpus is 0", () => {
  const index = buildBm25Index([]);
  assert.equal(index.n, 0);
  assert.equal(index.avgdl, 0);
});

test("idf gives rarer terms a higher weight", () => {
  const index = buildBm25Index(corpus);
  // log((3 - 2 + 0.5)/(2 + 0.5) + 1) = log(1.6)
  closeTo(idf(index, "gato"), 0.4700036292457356);
  // log((3 - 1 + 0.5)/(1 + 0.5) + 1) = log(8/3)
  closeTo(idf(index, "preto"), 0.9808292530117264);
  assert.ok(idf(index, "preto") > idf(index, "gato"));
});

test("idf of an unknown term uses df = 0", () => {
  const index = buildBm25Index(corpus);
  // log((3 - 0 + 0.5)/(0 + 0.5) + 1) = log(8)
  closeTo(idf(index, "inexistente"), Math.log(8));
});

test("searchBm25 scores a single-term query with exact BM25 values", () => {
  const index = buildBm25Index(corpus);
  const results = searchBm25(index, "gato");
  const byId = new Map(results.map((r) => [r.id, r.score]));
  // d1: tf=1, TFnorm = 2.2/2.2 = 1 -> score = idf(gato)
  closeTo(byId.get("d1")!, 0.4700036292457356);
  // d2: tf=2, TFnorm = 4.4/3.65 -> score = idf(gato) * 4.4/3.65
  closeTo(byId.get("d2")!, 0.5665797174469142);
  // d3 has no "gato"
  assert.equal(byId.get("d3"), 0);
});

test("term-frequency saturates: 2x tf yields less than 2x score", () => {
  const index = buildBm25Index(corpus);
  const byId = new Map(searchBm25(index, "gato").map((r) => [r.id, r.score]));
  const single = byId.get("d1")!; // tf = 1
  const doubled = byId.get("d2")!; // tf = 2 (longer doc too)
  assert.ok(doubled > single, "more occurrences should score higher");
  assert.ok(doubled < 2 * single, "but saturation keeps it below linear");
});

test("searchBm25 returns documents sorted by descending score", () => {
  const index = buildBm25Index(corpus);
  const results = searchBm25(index, "gato");
  assert.deepEqual(
    results.map((r) => r.id),
    ["d2", "d1", "d3"],
  );
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i - 1]!.score >= results[i]!.score);
  }
});

test("longer documents are penalized for the same raw tf", () => {
  // Same single occurrence of "alpha", different document lengths.
  const index = buildBm25Index([
    { id: "short", text: "alpha beta" },
    { id: "long", text: "alpha beta gamma delta epsilon zeta" },
  ]);
  const byId = new Map(searchBm25(index, "alpha").map((r) => [r.id, r.score]));
  assert.ok(
    byId.get("short")! > byId.get("long")!,
    "length normalization should favor the shorter document",
  );
});

test("k1 and b are configurable per index", () => {
  const base = buildBm25Index(corpus);
  const tuned = buildBm25Index(corpus, { k1: 2, b: 0 });
  assert.equal(tuned.k1, 2);
  assert.equal(tuned.b, 0);
  // With b = 0 there is no length normalization, so the score changes.
  const baseD2 = searchBm25(base, "gato").find((r) => r.id === "d2")!.score;
  const tunedD2 = searchBm25(tuned, "gato").find((r) => r.id === "d2")!.score;
  assert.notEqual(baseD2, tunedD2);
});

test("an empty query produces zero scores for every document", () => {
  const index = buildBm25Index(corpus);
  for (const result of searchBm25(index, "   ,. ")) {
    assert.equal(result.score, 0);
  }
});
