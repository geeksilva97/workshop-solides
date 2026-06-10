/**
 * Indicator value objects - the invariants of a single HR metric live here.
 *
 * A rate is a percentage and cannot be negative or above 100. eNPS is a score
 * in [-100, 100]. time-to-hire is a positive number of days. These rules are
 * enforced at construction, so an invalid indicator cannot exist in memory.
 */

export class InvalidIndicatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIndicatorError';
  }
}

/** A percentage rate in [0, 100] (e.g. turnover, absenteeism). */
export function rate(value: number, label = 'rate'): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new InvalidIndicatorError(`${label} must be a percentage in [0, 100], got ${value}`);
  }
  return value;
}

/** eNPS score in [-100, 100]. */
export function enps(value: number): number {
  if (!Number.isFinite(value) || value < -100 || value > 100) {
    throw new InvalidIndicatorError(`eNPS must be in [-100, 100], got ${value}`);
  }
  return value;
}

/** Days, strictly positive. */
export function days(value: number, label = 'days'): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new InvalidIndicatorError(`${label} must be a positive number of days, got ${value}`);
  }
  return value;
}
