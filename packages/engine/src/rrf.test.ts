import { test } from "node:test";
import assert from "node:assert/strict";
import { RRF_K, reciprocalRankFusion } from "./rrf.ts";

const closeTo = (actual: number, expected: number, eps = 1e-12): void => {
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
};

test("default k follows the paper", () => {
  assert.equal(RRF_K, 60);
});

test("fuses two lists with exact reciprocal-rank scores", () => {
  const fused = reciprocalRankFusion([
    { name: "dense", ids: ["x", "y", "z"] },
    { name: "bm25", ids: ["y", "w"] },
  ]);
  const byId = new Map(fused.map((d) => [d.id, d]));

  // y appears in both lists: 1/(60+2) + 1/(60+1)
  closeTo(byId.get("y")!.score, 1 / 62 + 1 / 61);
  closeTo(byId.get("x")!.score, 1 / 61);
  closeTo(byId.get("w")!.score, 1 / 62);
  closeTo(byId.get("z")!.score, 1 / 63);
});

test("an item present in more lists ranks above singletons", () => {
  const fused = reciprocalRankFusion([
    { name: "dense", ids: ["x", "y", "z"] },
    { name: "bm25", ids: ["y", "w"] },
  ]);
  assert.equal(fused[0]!.id, "y");
  assert.deepEqual(
    fused.map((d) => d.id),
    ["y", "x", "w", "z"],
  );
});

test("tracks the source lists each document came from, in input order", () => {
  const fused = reciprocalRankFusion([
    { name: "dense", ids: ["x", "y", "z"] },
    { name: "bm25", ids: ["y", "w"] },
  ]);
  const byId = new Map(fused.map((d) => [d.id, d]));
  assert.deepEqual(byId.get("y")!.sources, ["dense", "bm25"]);
  assert.deepEqual(byId.get("x")!.sources, ["dense"]);
  assert.deepEqual(byId.get("w")!.sources, ["bm25"]);
});

test("a missing item contributes nothing (rank-only, no scores)", () => {
  // "z" is only in the first list; its score must equal its single contribution.
  const fused = reciprocalRankFusion([
    { name: "a", ids: ["z"] },
    { name: "b", ids: ["other"] },
  ]);
  const z = fused.find((d) => d.id === "z")!;
  closeTo(z.score, 1 / 61);
  assert.deepEqual(z.sources, ["a"]);
});

test("ties keep first-encountered order (stable)", () => {
  // a: 1/61 + 1/62 ; b: 1/62 + 1/61 -> identical scores.
  const fused = reciprocalRankFusion([
    { name: "a", ids: ["a", "b"] },
    { name: "b", ids: ["b", "a"] },
  ]);
  closeTo(fused[0]!.score, fused[1]!.score);
  assert.deepEqual(
    fused.map((d) => d.id),
    ["a", "b"],
  );
});

test("k is configurable and changes the scores", () => {
  const [doc] = reciprocalRankFusion([{ name: "a", ids: ["x"] }], 0);
  // With k = 0, the top-ranked item scores 1/(0+1) = 1.
  closeTo(doc!.score, 1);
});

test("higher k dampens the contribution of a top position", () => {
  const big = reciprocalRankFusion([{ name: "a", ids: ["x"] }], 1000)[0]!;
  const small = reciprocalRankFusion([{ name: "a", ids: ["x"] }], 1)[0]!;
  assert.ok(big.score < small.score);
});

test("empty input yields an empty result", () => {
  assert.deepEqual(reciprocalRankFusion([]), []);
});

test("rank is 1-indexed: first position uses k+1, not k", () => {
  const [doc] = reciprocalRankFusion([{ name: "a", ids: ["first"] }], 60);
  closeTo(doc!.score, 1 / 61);
});
