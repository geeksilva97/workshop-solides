import { test } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, denseRank, dot, magnitude } from "./vector.ts";

const closeTo = (actual: number, expected: number, eps = 1e-12): void => {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
};

test("dot multiplies componentwise and sums", () => {
  assert.equal(dot([1, 2, 3], [4, 5, 6]), 32);
});

test("dot throws on length mismatch", () => {
  assert.throws(() => dot([1, 2], [1, 2, 3]), /length mismatch/);
});

test("magnitude is the L2 norm", () => {
  assert.equal(magnitude([3, 4]), 5);
  assert.equal(magnitude([0, 0, 0]), 0);
});

test("cosine of identical vectors is 1", () => {
  closeTo(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
});

test("cosine ignores magnitude (scale invariance)", () => {
  closeTo(cosineSimilarity([2, 0], [1, 0]), 1);
});

test("cosine of orthogonal vectors is 0", () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test("cosine of opposite vectors is -1", () => {
  closeTo(cosineSimilarity([1, 0], [-1, 0]), -1);
});

test("cosine of a 45-degree pair is 1/sqrt(2)", () => {
  closeTo(cosineSimilarity([1, 0], [1, 1]), Math.SQRT1_2);
});

test("cosine with a zero vector is defined as 0", () => {
  assert.equal(cosineSimilarity([0, 0], [1, 2]), 0);
  assert.equal(cosineSimilarity([1, 2], [0, 0]), 0);
});

test("denseRank orders documents by descending similarity", () => {
  const results = denseRank(
    [1, 0],
    [
      { id: "orthogonal", embedding: [0, 1] },
      { id: "aligned", embedding: [1, 0] },
      { id: "opposite", embedding: [-1, 0] },
      { id: "diagonal", embedding: [1, 1] },
    ],
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["aligned", "diagonal", "orthogonal", "opposite"],
  );
  closeTo(results[0]!.score, 1);
  closeTo(results[1]!.score, Math.SQRT1_2);
  assert.equal(results[2]!.score, 0);
  closeTo(results[3]!.score, -1);
});

test("denseRank keeps input order for ties (stable sort)", () => {
  const results = denseRank(
    [1, 0],
    [
      { id: "first", embedding: [1, 0] },
      { id: "zero", embedding: [0, 1] },
      { id: "second", embedding: [2, 0] },
    ],
  );
  assert.deepEqual(
    results.map((r) => r.id),
    ["first", "second", "zero"],
  );
});

test("denseRank returns one result per document", () => {
  const docs = [
    { id: "a", embedding: [1, 0] },
    { id: "b", embedding: [0, 1] },
  ];
  assert.equal(denseRank([1, 1], docs).length, docs.length);
});
