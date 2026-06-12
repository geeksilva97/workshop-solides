import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALERT_PERCENTILE,
  CRITICAL_PERCENTILE,
  INDICATOR_HIGHER_IS_WORSE,
  INDICATOR_UNITS,
  buildCriticalIndicator,
  buildKpiResult,
  classifyCriticalStatus,
  classifyKpiStatus,
  concernPercentile,
} from "./indicators.ts";

test("each indicator has a display unit", () => {
  assert.deepEqual(INDICATOR_UNITS, {
    turnover_voluntario: "%",
    turnover_involuntario: "%",
    absenteismo: "%",
    time_to_hire: "dias",
    enps: "pts",
    cost_per_hire: "R$",
    tenure_medio: "meses",
  });
});

test("direction: eNPS and tenure are higher-is-better, the rest higher-is-worse", () => {
  assert.deepEqual(INDICATOR_HIGHER_IS_WORSE, {
    turnover_voluntario: true,
    turnover_involuntario: true,
    absenteismo: true,
    time_to_hire: true,
    enps: false,
    cost_per_hire: true,
    tenure_medio: false,
  });
});

test("concernPercentile passes through for higher-is-worse indicators", () => {
  assert.equal(concernPercentile("turnover_voluntario", 90), 90);
  assert.equal(concernPercentile("absenteismo", 20), 20);
});

test("concernPercentile inverts for higher-is-better indicators", () => {
  // Low eNPS percentile is the worst position.
  assert.equal(concernPercentile("enps", 5), 95);
  assert.equal(concernPercentile("tenure_medio", 80), 20);
});

test("classifyKpiStatus is alert at/above the alert band, else healthy", () => {
  assert.equal(ALERT_PERCENTILE, 75);
  assert.equal(classifyKpiStatus(74), "saudavel");
  assert.equal(classifyKpiStatus(75), "alta");
  assert.equal(classifyKpiStatus(100), "alta");
});

test("classifyCriticalStatus has three bands", () => {
  assert.equal(CRITICAL_PERCENTILE, 90);
  assert.equal(classifyCriticalStatus(74), "saudavel");
  assert.equal(classifyCriticalStatus(75), "alta");
  assert.equal(classifyCriticalStatus(89), "alta");
  assert.equal(classifyCriticalStatus(90), "critico");
});

test("buildKpiResult positions a worst-case turnover as an alert", () => {
  const result = buildKpiResult({
    indicator: "turnover_voluntario",
    value: 20,
    cohort: [10, 12, 14, 16, 18],
    median: 14,
  });
  assert.deepEqual(result, {
    indicator: "turnover_voluntario",
    label: "Turnover voluntário",
    value: 20,
    median: 14,
    unit: "%",
    percentile: 100,
    status: "alta",
  });
});

test("buildKpiResult treats a low eNPS as an alert (inverted direction)", () => {
  const result = buildKpiResult({
    indicator: "enps",
    value: 5,
    cohort: [10, 20, 30, 40, 50],
    median: 30,
  });
  assert.equal(result.percentile, 0);
  assert.equal(result.status, "alta");
  assert.equal(result.unit, "pts");
  assert.equal(result.label, "eNPS");
});

test("buildKpiResult marks a fast time-to-hire as healthy", () => {
  const result = buildKpiResult({
    indicator: "time_to_hire",
    value: 25,
    cohort: [28, 38, 48, 56, 60],
    median: 48,
  });
  assert.equal(result.percentile, 0);
  assert.equal(result.status, "saudavel");
});

test("buildCriticalIndicator escalates the worst positions to critico", () => {
  const turnover = buildCriticalIndicator({
    indicator: "turnover_voluntario",
    value: 20,
    cohort: [10, 12, 14, 16, 18],
    median: 14,
  });
  assert.equal(turnover.status, "critico");
  assert.equal(turnover.percentile, 100);

  const enps = buildCriticalIndicator({
    indicator: "enps",
    value: 5,
    cohort: [10, 20, 30, 40, 50],
    median: 30,
  });
  assert.equal(enps.status, "critico");
});
