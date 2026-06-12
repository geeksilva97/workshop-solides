import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MIN_COHORT_SIZE,
  assertKAnonymity,
  percentileOf,
  percentiles,
  quantile,
  satisfiesKAnonymity,
} from "./percentiles.ts";

test("quantile uses linear interpolation on exact rank positions", () => {
  const values = [10, 20, 30, 40, 50];
  assert.equal(quantile(values, 0.25), 20);
  assert.equal(quantile(values, 0.5), 30);
  assert.equal(quantile(values, 0.75), 40);
  assert.equal(quantile(values, 0.9), 46); // 40 + 0.6 * 10
});

test("quantile interpolates between samples", () => {
  const values = [1, 2, 3, 4];
  assert.equal(quantile(values, 0.25), 1.75);
  assert.equal(quantile(values, 0.5), 2.5);
  assert.equal(quantile(values, 0.75), 3.25);
  closeEnough(quantile(values, 0.9), 3.7);
});

test("quantile sorts its input first", () => {
  // Unsorted, distinct values: the middle element (10) differs from the true
  // median (20), so this fails unless the input is actually sorted.
  assert.equal(quantile([30, 10, 20], 0.5), 20);
  assert.equal(quantile([30, 10, 20], 0.25), 15); // 10 + 0.5 * (20 - 10)
});

test("quantile of a single value is that value", () => {
  assert.equal(quantile([42], 0.25), 42);
  assert.equal(quantile([42], 0.9), 42);
});

test("quantile throws on an empty set", () => {
  assert.throws(() => quantile([], 0.5), /empty/);
});

test("percentiles returns the four cohort cut points", () => {
  assert.deepEqual(percentiles([10, 20, 30, 40, 50]), {
    p25: 20,
    p50: 30,
    p75: 40,
    p90: 46,
  });
});

test("percentileOf is the share of the cohort at or below the value", () => {
  const cohort = [10, 20, 30, 40, 50];
  assert.equal(percentileOf(35, cohort), 60); // 10,20,30 <= 35 -> 3/5
  assert.equal(percentileOf(50, cohort), 100);
  assert.equal(percentileOf(10, cohort), 20);
  assert.equal(percentileOf(5, cohort), 0);
});

test("percentileOf rounds to an integer", () => {
  // 1 of 3 at or below -> 33.33 -> 33
  assert.equal(percentileOf(10, [10, 20, 30]), 33);
});

test("percentileOf throws on an empty cohort", () => {
  assert.throws(() => percentileOf(1, []), /empty/);
});

test("k-anonymity floor is 5", () => {
  assert.equal(MIN_COHORT_SIZE, 5);
});

test("satisfiesKAnonymity compares against the floor", () => {
  assert.equal(satisfiesKAnonymity(5), true);
  assert.equal(satisfiesKAnonymity(4), false);
  assert.equal(satisfiesKAnonymity(3, 3), true);
  assert.equal(satisfiesKAnonymity(2, 3), false);
});

test("assertKAnonymity throws below the floor and passes at it", () => {
  assert.throws(() => assertKAnonymity(4), /k-anonymity/);
  assert.doesNotThrow(() => assertKAnonymity(5));
  assert.doesNotThrow(() => assertKAnonymity(2, 2));
});

function closeEnough(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) <= 1e-12, `${actual} != ${expected}`);
}
