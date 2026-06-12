/**
 * Per-indicator domain metadata and the percentile -> status classification.
 *
 * The cohort percentile only says "above N% of peers". Whether that is good or
 * bad depends on the indicator: a high turnover or absenteeism percentile is an
 * alert, but a high eNPS or tenure percentile is healthy. We fold that into a
 * single "concern" percentile (0 = best, 100 = worst) and classify from there.
 */
import {
  type Indicator,
  INDICATOR_LABELS,
  type KpiResult,
  type KpiStatus,
} from "@workshop/shared";
import type { CriticalIndicator } from "@workshop/shared";
import { percentileOf } from "./percentiles.ts";

/** Display unit per indicator. */
export const INDICATOR_UNITS: Record<Indicator, string> = {
  turnover_voluntario: "%",
  turnover_involuntario: "%",
  absenteismo: "%",
  time_to_hire: "dias",
  enps: "pts",
  cost_per_hire: "R$",
  tenure_medio: "meses",
};

/**
 * `true` when a higher raw value is worse (turnover, absenteeism, time-to-hire,
 * cost-per-hire); `false` when higher is better (eNPS, tenure).
 */
export const INDICATOR_HIGHER_IS_WORSE: Record<Indicator, boolean> = {
  turnover_voluntario: true,
  turnover_involuntario: true,
  absenteismo: true,
  time_to_hire: true,
  enps: false,
  cost_per_hire: true,
  tenure_medio: false,
};

/** Concern band thresholds (on the 0–100 concern scale). */
export const ALERT_PERCENTILE = 75;
export const CRITICAL_PERCENTILE = 90;

/**
 * Map a raw cohort percentile onto the 0–100 concern scale, where 100 is always
 * the worst position regardless of the indicator's direction.
 */
export const concernPercentile = (
  indicator: Indicator,
  percentile: number,
): number => (INDICATOR_HIGHER_IS_WORSE[indicator] ? percentile : 100 - percentile);

/** Two-state status used on KPI cards: alert vs healthy. */
export const classifyKpiStatus = (concern: number): KpiStatus =>
  concern >= ALERT_PERCENTILE ? "alta" : "saudavel";

/** Three-state status used in the diagnosis: critical / alert / healthy. */
export const classifyCriticalStatus = (
  concern: number,
): CriticalIndicator["status"] => {
  if (concern >= CRITICAL_PERCENTILE) return "critico";
  if (concern >= ALERT_PERCENTILE) return "alta";
  return "saudavel";
};

/** A client indicator value measured against the cohort distribution. */
export interface IndicatorMeasurement {
  readonly indicator: Indicator;
  /** The client company's raw value for this indicator. */
  readonly value: number;
  /** The cohort's raw values for this indicator. */
  readonly cohort: readonly number[];
  /** The cohort median (p50) for this indicator. */
  readonly median: number;
}

/** Build the KPI-card result (shared contract) for one measured indicator. */
export const buildKpiResult = (m: IndicatorMeasurement): KpiResult => {
  const percentile = percentileOf(m.value, m.cohort);
  return {
    indicator: m.indicator,
    label: INDICATOR_LABELS[m.indicator],
    value: m.value,
    median: m.median,
    unit: INDICATOR_UNITS[m.indicator],
    percentile,
    status: classifyKpiStatus(concernPercentile(m.indicator, percentile)),
  };
};

/** Build the richer diagnosis indicator (shared contract). */
export const buildCriticalIndicator = (
  m: IndicatorMeasurement,
): CriticalIndicator => {
  const percentile = percentileOf(m.value, m.cohort);
  return {
    label: INDICATOR_LABELS[m.indicator],
    value: m.value,
    median: m.median,
    unit: INDICATOR_UNITS[m.indicator],
    percentile,
    status: classifyCriticalStatus(concernPercentile(m.indicator, percentile)),
  };
};
