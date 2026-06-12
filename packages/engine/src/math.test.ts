import { test } from "node:test";
import assert from "node:assert/strict";
import { clamp, mean } from "./math.ts";

test("clamp returns the value when inside the range", () => {
  assert.equal(clamp(5, 0, 10), 5);
});

test("clamp floors to min when below the range", () => {
  assert.equal(clamp(-3, 0, 10), 0);
});

test("clamp ceils to max when above the range", () => {
  assert.equal(clamp(42, 0, 10), 10);
});

test("clamp keeps the boundaries inclusive", () => {
  assert.equal(clamp(0, 0, 10), 0);
  assert.equal(clamp(10, 0, 10), 10);
});

test("mean averages a list", () => {
  assert.equal(mean([2, 4, 6]), 4);
});

test("mean of an empty list is 0", () => {
  assert.equal(mean([]), 0);
});

test("mean handles a single value", () => {
  assert.equal(mean([7]), 7);
});
