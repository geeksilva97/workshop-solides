/**
 * The diagnosis the judge produces - a domain object with a fixed shape. The
 * shape is a domain rule (the report contract), and it is validated, not trusted
 * from the LLM. `DIAGNOSTICO_TOOL_SCHEMA` is the same contract expressed as a
 * JSON Schema, used to force the model's tool output.
 */

export type Severidade = 'alta' | 'media' | 'baixa';
const SEVERIDADES: readonly Severidade[] = ['alta', 'media', 'baixa'];

export type IndicadorCritico = {
  kpi: string;
  leitura: string;
  severidade: Severidade;
};

export type Diagnostico = {
  diagnostico_principal: string;
  indicadores_criticos: IndicadorCritico[];
  hipoteses: string[];
  proxima_acao: string;
};

export class InvalidDiagnosticoError extends Error {
  constructor(message: string) {
    super(`invalid diagnostico: ${message}`);
    this.name = 'InvalidDiagnosticoError';
  }
}

export const DIAGNOSTICO_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    diagnostico_principal: { type: 'string', description: 'conclusão central em uma frase' },
    indicadores_criticos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kpi: { type: 'string' },
          leitura: { type: 'string', description: '1-2 frases, usando só os números do input' },
          severidade: { type: 'string', enum: ['alta', 'media', 'baixa'] },
        },
        required: ['kpi', 'leitura', 'severidade'],
        additionalProperties: false,
      },
    },
    hipoteses: { type: 'array', items: { type: 'string' } },
    proxima_acao: { type: 'string', description: 'recomendação acionável' },
  },
  required: ['diagnostico_principal', 'indicadores_criticos', 'hipoteses', 'proxima_acao'],
  additionalProperties: false,
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Validate the (untrusted) judge output against the domain contract. */
export function validateDiagnostico(raw: unknown): Diagnostico {
  if (typeof raw !== 'object' || raw === null) throw new InvalidDiagnosticoError('not an object');
  const d = raw as Record<string, unknown>;

  if (!isNonEmptyString(d.diagnostico_principal)) {
    throw new InvalidDiagnosticoError('diagnostico_principal must be a non-empty string');
  }
  if (!isNonEmptyString(d.proxima_acao)) {
    throw new InvalidDiagnosticoError('proxima_acao must be a non-empty string');
  }
  if (!Array.isArray(d.indicadores_criticos) || d.indicadores_criticos.length === 0) {
    throw new InvalidDiagnosticoError('indicadores_criticos must be a non-empty array');
  }
  if (!Array.isArray(d.hipoteses) || !d.hipoteses.every(isNonEmptyString)) {
    throw new InvalidDiagnosticoError('hipoteses must be an array of strings');
  }

  const indicadores = d.indicadores_criticos.map((item, i): IndicadorCritico => {
    if (typeof item !== 'object' || item === null) {
      throw new InvalidDiagnosticoError(`indicador ${i} is not an object`);
    }
    const ic = item as Record<string, unknown>;
    if (!isNonEmptyString(ic.kpi) || !isNonEmptyString(ic.leitura)) {
      throw new InvalidDiagnosticoError(`indicador ${i} missing kpi/leitura`);
    }
    if (!SEVERIDADES.includes(ic.severidade as Severidade)) {
      throw new InvalidDiagnosticoError(`indicador ${i} has invalid severidade`);
    }
    return { kpi: ic.kpi, leitura: ic.leitura, severidade: ic.severidade as Severidade };
  });

  return {
    diagnostico_principal: d.diagnostico_principal,
    indicadores_criticos: indicadores,
    hipoteses: d.hipoteses as string[],
    proxima_acao: d.proxima_acao,
  };
}
