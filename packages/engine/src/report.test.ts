import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnosticSchema } from "@workshop/shared";
import type { IndicatorMeasurement } from "./indicators.ts";
import {
  INDICATOR_HYPOTHESES,
  MAX_HYPOTHESES,
  NEXT_ACTION,
  buildDiagnostic,
} from "./report.ts";

const tenStep = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Reusable measurements with known concern percentiles.
const worstTurnover: IndicatorMeasurement = {
  indicator: "turnover_voluntario",
  value: 20,
  cohort: [10, 12, 14, 16, 18], // value above all -> p100, concern 100 (critico)
  median: 14,
};
const midTimeToHire: IndicatorMeasurement = {
  indicator: "time_to_hire",
  value: 95,
  cohort: tenStep, // 9 of 10 at or below -> p90, concern 90 (critico)
  median: 55,
};
const alertAbsenteeism: IndicatorMeasurement = {
  indicator: "absenteismo",
  value: 4,
  cohort: [2, 2.5, 3, 3.5, 5], // 4 of 5 at or below -> p80, concern 80 (alta)
  median: 3,
};
const healthyTimeToHire: IndicatorMeasurement = {
  indicator: "time_to_hire",
  value: 25,
  cohort: [28, 38, 48, 56, 60], // below all -> p0, concern 0 (saudavel)
  median: 48,
};
const healthyEnps: IndicatorMeasurement = {
  indicator: "enps",
  value: 50,
  cohort: [10, 20, 30, 40, 50], // top -> p100, concern 0 (saudavel)
  median: 30,
};

test("produces a Diagnostic that satisfies the shared schema", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [worstTurnover, alertAbsenteeism, healthyTimeToHire],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.doesNotThrow(() => diagnosticSchema.parse(diagnostic));
});

test("passes through benchmarkId and updatedAt unchanged", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-42",
    companyName: "Acme",
    measurements: [healthyEnps],
    updatedAt: "2026-01-02T03:04:05.000Z",
  });
  assert.equal(diagnostic.benchmarkId, "bm-42");
  assert.equal(diagnostic.updatedAt, "2026-01-02T03:04:05.000Z");
});

test("an all-healthy company yields no critical indicators or hypotheses", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [healthyTimeToHire, healthyEnps],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.deepEqual(diagnostic.indicators, []);
  assert.deepEqual(diagnostic.hypotheses, []);
  assert.equal(
    diagnostic.headline,
    "Acme está saudável: nenhum indicador fora da faixa do cohort.",
  );
  assert.equal(
    diagnostic.summary,
    "Todos os 2 indicadores avaliados estão dentro da faixa do cohort.",
  );
});

test("orders critical indicators worst-first regardless of input order", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    // Deliberately shuffled: absenteeism (80), turnover (100), time-to-hire (90).
    measurements: [alertAbsenteeism, worstTurnover, midTimeToHire, healthyEnps],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.deepEqual(
    diagnostic.indicators.map((i) => i.label),
    ["Turnover voluntário", "Time-to-hire", "Absenteísmo"],
  );
  assert.deepEqual(
    diagnostic.indicators.map((i) => i.status),
    ["critico", "critico", "alta"],
  );
});

test("headline and summary reflect the critical count and labels", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [worstTurnover, alertAbsenteeism, healthyEnps],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.equal(
    diagnostic.headline,
    "Acme: 2 de 3 indicadores fora da faixa saudável vs. o cohort.",
  );
  assert.equal(
    diagnostic.summary,
    "Principais pontos de atenção: Turnover voluntário (p100), Absenteísmo (p80).",
  );
});

test("hypotheses map to the worst indicators, ordered 1..n", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [alertAbsenteeism, worstTurnover, midTimeToHire],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.deepEqual(
    diagnostic.hypotheses.map((h) => h.order),
    [1, 2, 3],
  );
  assert.equal(
    diagnostic.hypotheses[0]!.title,
    INDICATOR_HYPOTHESES.turnover_voluntario.title,
  );
  assert.equal(
    diagnostic.hypotheses[1]!.title,
    INDICATOR_HYPOTHESES.time_to_hire.title,
  );
  assert.equal(
    diagnostic.hypotheses[2]!.title,
    INDICATOR_HYPOTHESES.absenteismo.title,
  );
});

test("hypotheses are capped at MAX_HYPOTHESES even with more criticals", () => {
  const fourth: IndicatorMeasurement = {
    indicator: "cost_per_hire",
    value: 9999,
    cohort: [1000, 2000, 3000, 4000, 5000], // above all -> critico
    median: 3000,
  };
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [worstTurnover, midTimeToHire, alertAbsenteeism, fourth],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.equal(diagnostic.indicators.length, 4);
  assert.equal(diagnostic.hypotheses.length, 3);
  assert.equal(MAX_HYPOTHESES, 3);
});

test("every indicator yields a schema-valid diagnostic with a full hypothesis", () => {
  const indicators = [
    "turnover_voluntario",
    "turnover_involuntario",
    "absenteismo",
    "time_to_hire",
    "enps",
    "cost_per_hire",
    "tenure_medio",
  ] as const;
  for (const indicator of indicators) {
    // A value that lands at the worst position for this indicator's direction.
    const isHigherWorse = indicator !== "enps" && indicator !== "tenure_medio";
    const measurement: IndicatorMeasurement = {
      indicator,
      value: isHigherWorse ? 100 : 0,
      cohort: [10, 20, 30, 40, 50],
      median: 30,
    };
    const diagnostic = buildDiagnostic({
      benchmarkId: "bm-1",
      companyName: "Acme",
      measurements: [measurement],
      updatedAt: "2026-06-12T00:00:00.000Z",
    });
    assert.doesNotThrow(() => diagnosticSchema.parse(diagnostic));
    assert.equal(diagnostic.hypotheses.length, 1);
    assert.ok(diagnostic.hypotheses[0]!.title.length > 0);
    assert.ok(diagnostic.hypotheses[0]!.description.length > 0);
  }
});

test("uses the static next action", () => {
  const diagnostic = buildDiagnostic({
    benchmarkId: "bm-1",
    companyName: "Acme",
    measurements: [worstTurnover],
    updatedAt: "2026-06-12T00:00:00.000Z",
  });
  assert.deepEqual(diagnostic.nextAction, {
    title: NEXT_ACTION.title,
    description: NEXT_ACTION.description,
    ctaLabel: NEXT_ACTION.ctaLabel,
  });
});
