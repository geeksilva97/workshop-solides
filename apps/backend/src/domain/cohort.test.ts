import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cohort, CohortTooSmallError, MIN_COHORT_SIZE } from './cohort.ts';
import { POOL } from '../infra/seed/companies.ts';

test('Cohort enforces k-anonymity at construction', () => {
  const tooFew = POOL.slice(0, MIN_COHORT_SIZE - 1);
  assert.throws(() => Cohort.of(tooFew), CohortTooSmallError);

  const enough = POOL.slice(0, MIN_COHORT_SIZE);
  const cohort = Cohort.of(enough);
  assert.equal(cohort.size, MIN_COHORT_SIZE);
});
