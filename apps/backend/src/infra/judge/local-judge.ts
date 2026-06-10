import type { Diagnostico, IndicadorCritico, Severidade } from '../../domain/diagnostico.ts';
import type { DiagnosisInput, Judge } from '../../application/ports.ts';

/**
 * Deterministic stand-in for the LLM judge, used by the reference run (no API
 * key). It turns the percentiles into a diagnosis with simple rules. The real
 * `AnthropicJudge` produces a far richer narrative; both satisfy the same port
 * and the same domain validation.
 */
export class LocalJudge implements Judge {
  async diagnose(input: DiagnosisInput): Promise<Diagnostico> {
    const criticos = input.kpis.filter((k) => k.sinal !== 'ok');

    const indicadores: IndicadorCritico[] = (criticos.length ? criticos : input.kpis)
      .slice(0, 3)
      .map((k) => ({
        kpi: k.kpi,
        leitura: `${k.kpi} em ${k.valor} (${k.posicao} do cohort, mediana ${k.p50}).`,
        severidade: severidadeOf(k.sinal),
      }));

    const piorTurnover = input.kpis.find((k) => k.kpi === 'turnover_voluntario');
    const principal =
      piorTurnover && piorTurnover.sinal === 'bad'
        ? 'Problema de retenção: a empresa perde gente em volume bem acima do cohort comparável.'
        : 'Indicadores de RH majoritariamente dentro da faixa do cohort comparável.';

    return {
      diagnostico_principal: principal,
      indicadores_criticos: indicadores,
      hipoteses: [
        'Onboarding ou primeiros meses de casa',
        'Carga de trabalho ou clareza de carreira',
        'Compensação vs mercado regional',
      ],
      proxima_acao:
        'Rodar pesquisa de saída qualitativa nos últimos desligamentos voluntários e cruzar com engajamento por área.',
    };
  }
}

function severidadeOf(sinal: 'ok' | 'warn' | 'bad'): Severidade {
  if (sinal === 'bad') return 'alta';
  if (sinal === 'warn') return 'media';
  return 'baixa';
}
