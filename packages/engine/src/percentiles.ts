/**
 * Distribution statistics for a cohort of values, plus the LGPD k-anonymity
 * guard. Pure numeric code — no domain knowledge lives here.
 */

/** Minimum cohort size before a benchmark may be reported (LGPD k-anonymity). */
export const MIN_COHORT_SIZE = 5;

/** The four cohort cut points reported for every indicator. */
export interface Quartiles {
  readonly p25: number;
  readonly p50: number;
  readonly p75: number;
  readonly p90: number;
}

const sortedAscending = (values: readonly number[]): number[] =>
  [...values].sort((a, b) => a - b);

/**
 * Linear-interpolation quantile (the "type 7" / spreadsheet PERCENTILE.INC
 * method) for `q` in [0, 1]. `values` need not be pre-sorted.
 */
export const quantile = (values: readonly number[], q: number): number => {
  if (values.length === 0) {
    throw new Error("cannot compute a quantile of an empty set");
  }
  const sorted = sortedAscending(values);
  const rank = q * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const fraction = rank - lower;
  return sorted[lower]! + fraction * (sorted[upper]! - sorted[lower]!);
};

/** The p25/p50/p75/p90 cut points of a cohort. */
export const percentiles = (values: readonly number[]): Quartiles => ({
  p25: quantile(values, 0.25),
  p50: quantile(values, 0.5),
  p75: quantile(values, 0.75),
  p90: quantile(values, 0.9),
});

/**
 * Where `value` falls within `cohort`, as an integer 0–100: the share of the
 * cohort at or below `value` (empirical CDF). Higher means "above more peers".
 */
export const percentileOf = (
  value: number,
  cohort: readonly number[],
): number => {
  if (cohort.length === 0) {
    throw new Error("cannot position a value against an empty cohort");
  }
  let atOrBelow = 0;
  for (const sample of cohort) {
    if (sample <= value) atOrBelow++;
  }
  return Math.round((100 * atOrBelow) / cohort.length);
};

/** Whether a cohort is large enough to report without re-identification risk. */
export const satisfiesKAnonymity = (
  cohortSize: number,
  min: number = MIN_COHORT_SIZE,
): boolean => cohortSize >= min;

/** Throw unless the cohort meets the k-anonymity floor. */
export const assertKAnonymity = (
  cohortSize: number,
  min: number = MIN_COHORT_SIZE,
): void => {
  if (!satisfiesKAnonymity(cohortSize, min)) {
    throw new Error(
      `cohort of ${cohortSize} violates k-anonymity (minimum ${min})`,
    );
  }
};
