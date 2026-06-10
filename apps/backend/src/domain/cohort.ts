import type { Company } from './company.ts';
import type { KpiKey } from './kpis.ts';

/**
 * k-anonymity threshold: publishing aggregates over fewer than this many
 * companies risks reverse-identifying an individual company's numbers (LGPD).
 * A cohort below it is not a valid object.
 */
export const MIN_COHORT_SIZE = 5;

export class CohortTooSmallError extends Error {
  constructor(size: number) {
    super(`cohort has ${size} companies; k-anonymity requires at least ${MIN_COHORT_SIZE}`);
    this.name = 'CohortTooSmallError';
  }
}

/**
 * A cohort of comparable companies. The k-anonymity invariant is enforced at
 * construction: it is impossible to hold an under-sized Cohort in memory. This
 * rule comes from the domain (LGPD), not from the caller or the database.
 */
export class Cohort {
  readonly companies: readonly Company[];

  private constructor(companies: readonly Company[]) {
    this.companies = companies;
  }

  static of(companies: readonly Company[]): Cohort {
    if (companies.length < MIN_COHORT_SIZE) {
      throw new CohortTooSmallError(companies.length);
    }
    return new Cohort(companies);
  }

  get size(): number {
    return this.companies.length;
  }

  /** All values of one KPI across the cohort, for percentile math. */
  valuesOf(kpi: KpiKey): number[] {
    return this.companies.map((c) => c.kpis[kpi]);
  }
}
