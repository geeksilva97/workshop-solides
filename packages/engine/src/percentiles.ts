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
  // TODO (run/04-percentis): quantil por interpolação linear (tipo 7 /
  // PERCENTILE.INC) para q em [0,1]. Dica: ordene e interpole entre os vizinhos.
  throw new Error("TODO: implemente quantile — ver docs/WORKSHOP.md");
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
  // TODO (run/04-percentis): ECDF — proporção do cohort <= value, em 0–100
  // (inteiro arredondado).
  throw new Error("TODO: implemente percentileOf — ver docs/WORKSHOP.md");
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
