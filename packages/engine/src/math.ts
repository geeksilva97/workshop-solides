/**
 * Small numeric helpers shared across the engine.
 * Kept pure and dependency-free so they are trivially unit- and mutation-tested.
 */

/** Constrain `value` to the inclusive `[min, max]` range. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Arithmetic mean of a non-empty list. Returns 0 for an empty list. */
export const mean = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
};
