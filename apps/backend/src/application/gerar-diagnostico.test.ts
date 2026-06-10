import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarDiagnostico } from './gerar-diagnostico.ts';
import { percentis } from './percentis.ts';
import { Cohort } from '../domain/cohort.ts';
import { InvalidDiagnosticoError } from '../domain/diagnostico.ts';
import type { DiagnosisInput, Judge } from './ports.ts';
import { LocalJudge } from '../infra/judge/local-judge.ts';
import { SOLIPSE, POOL } from '../infra/seed/companies.ts';

const techCohort = Cohort.of(POOL.filter((c) => c.sector === 'tecnologia'));
const input: DiagnosisInput = {
  empresa: SOLIPSE.name,
  setor: SOLIPSE.sector,
  kpis: percentis(SOLIPSE.kpis, techCohort),
};

test('gerarDiagnostico produces a valid diagnosis from the local judge', async () => {
  const d = await gerarDiagnostico(new LocalJudge(), input);
  assert.ok(d.diagnostico_principal.length > 0);
  assert.ok(d.indicadores_criticos.length >= 1 && d.indicadores_criticos.length <= 3);
  assert.ok(d.indicadores_criticos.every((i) => ['alta', 'media', 'baixa'].includes(i.severidade)));
});

test('gerarDiagnostico rejects a judge that returns an off-schema payload', async () => {
  const badJudge: Judge = {
    // missing required fields / wrong enum
    diagnose: async () => ({ diagnostico_principal: '', indicadores_criticos: [] }) as never,
  };
  await assert.rejects(() => gerarDiagnostico(badJudge, input), InvalidDiagnosticoError);
});
