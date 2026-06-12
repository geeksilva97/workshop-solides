/**
 * Deterministic diagnostic builder.
 *
 * Turns the client's measured indicators into the `Diagnostic` contract the
 * frontend renders — headline, summary, the critical indicators (worst first),
 * investigation hypotheses, and a next action. No LLM here: this is the
 * always-available, fully testable core. An optional LLM narrative can be
 * layered on top later via the `Judge` port.
 */
import type {
  CriticalIndicator,
  Diagnostic,
  Hypothesis,
  Indicator,
} from "@workshop/shared";
import {
  type IndicatorMeasurement,
  buildCriticalIndicator,
  concernPercentile,
} from "./indicators.ts";

/** How many hypotheses the diagnosis surfaces at most. */
export const MAX_HYPOTHESES = 3;

/**
 * One investigation hypothesis template per indicator.
 *
 * Stryker disable next-line all: static domain copy, not logic. Structural
 * validity (every entry has title + description) is guarded by the
 * "every indicator yields a schema-valid diagnostic" test instead.
 */
// Stryker disable all
export const INDICATOR_HYPOTHESES: Record<
  Indicator,
  { title: string; description: string }
> = {
  turnover_voluntario: {
    title: "Saídas voluntárias acima do cohort",
    description:
      "Investigue remuneração, plano de carreira e qualidade da liderança nas áreas com mais pedidos de demissão.",
  },
  turnover_involuntario: {
    title: "Desligamentos involuntários elevados",
    description:
      "Revise critérios de contratação e onboarding: desligamentos precoces costumam apontar erro de fit na entrada.",
  },
  absenteismo: {
    title: "Absenteísmo como sinal precoce",
    description:
      "Absenteísmo alto antecede turnover. Mapeie carga de trabalho, clima e afastamentos por saúde.",
  },
  time_to_hire: {
    title: "Tempo de contratação fora da faixa",
    description:
      "Analise gargalos no funil de recrutamento e a disponibilidade de talentos para os cargos abertos.",
  },
  enps: {
    title: "eNPS abaixo dos pares",
    description:
      "Conduza escuta ativa para entender os detratores e priorize as alavancas de engajamento mais citadas.",
  },
  cost_per_hire: {
    title: "Custo por contratação elevado",
    description:
      "Compare canais de aquisição e o uso de agências; canais próprios tendem a reduzir o custo unitário.",
  },
  tenure_medio: {
    title: "Tenure médio abaixo do cohort",
    description:
      "Permanência curta indica problemas de retenção no primeiro ano; reforce desenvolvimento e reconhecimento.",
  },
};

/** The static next-action shown at the end of the diagnosis. */
export const NEXT_ACTION = {
  title: "Aprofundar o diagnóstico",
  description:
    "Revise os indicadores críticos com a liderança e priorize um plano de ação para os próximos 90 dias.",
  ctaLabel: "Gerar plano de ação",
} as const;
// Stryker restore all

export interface DiagnosticInput {
  readonly benchmarkId: string;
  readonly companyName: string;
  readonly measurements: readonly IndicatorMeasurement[];
  /** ISO timestamp; injected so the builder stays pure/deterministic. */
  readonly updatedAt: string;
}

/** Build the deterministic diagnosis from measured indicators. */
export const buildDiagnostic = (input: DiagnosticInput): Diagnostic => {
  // TODO (run/05/06-diagnóstico): a partir das measurements, ordene por "concern"
  // (pior primeiro), separe os indicadores críticos (status !== "saudavel"), e
  // monte o Diagnostic: headline + summary (use os helpers abaixo), indicadores
  // críticos, até MAX_HYPOTHESES hipóteses (INDICATOR_HYPOTHESES) e NEXT_ACTION.
  throw new Error("TODO: implemente buildDiagnostic — ver docs/WORKSHOP.md");
};

const buildHeadline = (
  companyName: string,
  criticalCount: number,
  total: number,
): string => {
  if (criticalCount === 0) {
    return `${companyName} está saudável: nenhum indicador fora da faixa do cohort.`;
  }
  return `${companyName}: ${criticalCount} de ${total} indicadores fora da faixa saudável vs. o cohort.`;
};

const buildSummary = (
  critical: readonly CriticalIndicator[],
  total: number,
): string => {
  if (critical.length === 0) {
    return `Todos os ${total} indicadores avaliados estão dentro da faixa do cohort.`;
  }
  const list = critical
    .map((indicator) => `${indicator.label} (p${indicator.percentile})`)
    .join(", ");
  return `Principais pontos de atenção: ${list}.`;
};
