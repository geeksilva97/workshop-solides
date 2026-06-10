import { rate, enps, days } from './indicator.ts';

/**
 * The set of HR KPIs Tom Ranks benchmarks. The keys are the canonical metric
 * ids used across retrieval, percentiles and the judge.
 */
export type KpiKey = 'turnover_voluntario' | 'absenteismo' | 'time_to_hire' | 'enps';

export const KPI_KEYS: readonly KpiKey[] = [
  'turnover_voluntario',
  'absenteismo',
  'time_to_hire',
  'enps',
];

export type Kpis = {
  turnover_voluntario: number; // % ao ano
  absenteismo: number; // %
  time_to_hire: number; // dias
  enps: number; // -100..100
};

/** Build a validated Kpis, enforcing each indicator's invariant. */
export function makeKpis(raw: Kpis): Kpis {
  return {
    turnover_voluntario: rate(raw.turnover_voluntario, 'turnover_voluntario'),
    absenteismo: rate(raw.absenteismo, 'absenteismo'),
    time_to_hire: days(raw.time_to_hire, 'time_to_hire'),
    enps: enps(raw.enps),
  };
}

/** Whether a higher value is worse for this KPI (used by percentile reading). */
export function higherIsWorse(kpi: KpiKey): boolean {
  return kpi !== 'enps'; // for eNPS, higher is better; for the rest, higher is worse
}
