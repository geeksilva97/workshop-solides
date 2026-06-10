import type { Company } from './company.ts';
import type { KpiKey } from './kpis.ts';

/**
 * A cohort of comparable companies.
 *
 * NOTE (live-build): in step 05 this factory gains the k-anonymity invariant -
 * a cohort below MIN_COHORT_SIZE companies cannot be constructed, because
 * publishing aggregates over too few companies leaks individual data (LGPD).
 * For now `of` accepts any non-empty set; the guard is added on stage.
 */
export class Cohort {
  readonly companies: readonly Company[];

  private constructor(companies: readonly Company[]) {
    this.companies = companies;
  }

  static of(companies: readonly Company[]): Cohort {
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
