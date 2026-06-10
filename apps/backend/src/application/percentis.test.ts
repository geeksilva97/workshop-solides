import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentis } from './percentis.ts';
import { Cohort } from '../domain/cohort.ts';
import { SOLIPSE, POOL } from '../infra/seed/companies.ts';

// the natural cohort: the tech/SaaS companies (ids starting 1..8)
const techCohort = Cohort.of(POOL.filter((c) => c.sector === 'tecnologia'));

test('positions Solípse at the extremes its bad KPIs deserve', () => {
  const result = percentis(SOLIPSE.kpis, techCohort);
  const by = (k: string) => result.find((r) => r.kpi === k)!;

  // turnover 28.4 is far above the tech cohort -> high percentile, bad signal
  const turnover = by('turnover_voluntario');
  assert.ok(Number(turnover.posicao.slice(1)) >= 90);
  assert.equal(turnover.sinal, 'bad');

  // eNPS -5 is below the whole tech cohort -> low percentile, bad signal
  const enps = by('enps');
  assert.ok(Number(enps.posicao.slice(1)) <= 10);
  assert.equal(enps.sinal, 'bad');

  // every KPI reports a full distribution
  for (const r of result) {
    assert.ok(r.p25 <= r.p50 && r.p50 <= r.p75 && r.p75 <= r.p90);
  }
});

test('percentis does not re-check cohort size - that lives in the Cohort', () => {
  // a valid cohort is assumed; the guard already ran in Cohort.of
  const result = percentis(SOLIPSE.kpis, techCohort);
  assert.equal(result.length, 4);
});
