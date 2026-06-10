import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBenchmark } from './run-benchmark.ts';
import { InMemoryCompanyRepository } from '../infra/db/in-memory-company-repository.ts';
import { LocalCrossEncoderReranker } from '../infra/reranker/local-cross-encoder.ts';
import { LocalJudge } from '../infra/judge/local-judge.ts';
import { SOLIPSE } from '../infra/seed/companies.ts';
import { MIN_COHORT_SIZE } from '../domain/cohort.ts';

test('the full pipeline runs end to end and diagnoses Solípse', async () => {
  const deps = {
    repo: new InMemoryCompanyRepository(),
    reranker: new LocalCrossEncoderReranker(),
    judge: new LocalJudge(),
  };

  const result = await runBenchmark(deps, SOLIPSE);

  // cohort respects k-anonymity
  assert.ok(result.cohort.length >= MIN_COHORT_SIZE);
  // all four KPIs are positioned
  assert.equal(result.kpis.length, 4);
  // the diagnosis is well-formed and flags turnover (Solípse's worst KPI)
  assert.ok(result.diagnostico.diagnostico_principal.length > 0);
  assert.ok(result.diagnostico.indicadores_criticos.some((i) => i.kpi === 'turnover_voluntario'));
});
