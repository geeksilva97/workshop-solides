import type { Cohort } from '../domain/cohort.ts';
import { KPI_KEYS, type KpiKey, type Kpis, higherIsWorse } from '../domain/kpis.ts';

export type Signal = 'ok' | 'warn' | 'bad';

export type KpiPercentile = {
  kpi: KpiKey;
  valor: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  posicao: string; // e.g. "p95"
  sinal: Signal;
};

/**
 * Pure percentile math. For each KPI: the cohort distribution (p25/p50/p75/p90)
 * and where the client value falls. No LLM, no I/O. The k-anonymity guard lives
 * in `Cohort` (its construction), not here - this function trusts a valid cohort.
 */
export function percentis(kpis: Kpis, cohort: Cohort): KpiPercentile[] {
  return KPI_KEYS.map((kpi) => {
    const sorted = cohort.valuesOf(kpi).slice().sort((a, b) => a - b);
    const valor = kpis[kpi];
    const pr = percentileRank(sorted, valor);

    return {
      kpi,
      valor,
      p25: round(quantile(sorted, 0.25)),
      p50: round(quantile(sorted, 0.5)),
      p75: round(quantile(sorted, 0.75)),
      p90: round(quantile(sorted, 0.9)),
      posicao: `p${Math.round(pr)}`,
      sinal: signalFor(kpi, valor, sorted),
    };
  });
}

/** Linear-interpolation quantile (type-7, like NumPy's default). */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (pos - lo) * (sorted[hi]! - sorted[lo]!);
}

/** Percentile rank of x within the distribution, 0..100. */
export function percentileRank(sorted: number[], x: number): number {
  if (sorted.length === 0) return Number.NaN;
  let below = 0;
  let equal = 0;
  for (const v of sorted) {
    if (v < x) below++;
    else if (v === x) equal++;
  }
  return ((below + 0.5 * equal) / sorted.length) * 100;
}

function signalFor(kpi: KpiKey, valor: number, sorted: number[]): Signal {
  const p25 = quantile(sorted, 0.25);
  const p50 = quantile(sorted, 0.5);
  const p75 = quantile(sorted, 0.75);

  if (higherIsWorse(kpi)) {
    if (valor > p75) return 'bad';
    if (valor <= p50) return 'ok';
    return 'warn';
  }
  // eNPS: higher is better
  if (valor < p25) return 'bad';
  if (valor >= p50) return 'ok';
  return 'warn';
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
