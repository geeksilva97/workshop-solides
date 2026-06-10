import Anthropic from '@anthropic-ai/sdk';
import { DIAGNOSTICO_TOOL_SCHEMA, type Diagnostico } from '../../domain/diagnostico.ts';
import type { DiagnosisInput, Judge } from '../../application/ports.ts';

/**
 * Production judge: Anthropic Messages API with structured output forced via
 * tool use. We define one tool (`emitir_diagnostico`) whose input schema IS the
 * diagnosis contract, and force the model to call it with `tool_choice`. The
 * model cannot answer in free text - it must fill the schema. The system prompt
 * pins the role and forbids inventing numbers.
 *
 * The returned object is still validated by the `gerarDiagnostico` use case -
 * tool use forces the shape, not the sanity.
 */

const MODEL = 'claude-opus-4-8';
const TOOL_NAME = 'emitir_diagnostico';

const SYSTEM = [
  'Você é um analista sênior de People Analytics.',
  'Recebe os KPIs de RH de uma empresa cliente comparados com um cohort de empresas similares.',
  'Produza um diagnóstico direto e acionável chamando a tool emitir_diagnostico.',
  'Use SOMENTE os números presentes no input. Não invente nenhum valor.',
].join(' ');

export class AnthropicJudge implements Judge {
  private readonly client: Anthropic;

  constructor(client: Anthropic = new Anthropic()) {
    this.client = client;
  }

  async diagnose(input: DiagnosisInput): Promise<Diagnostico> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [
        {
          name: TOOL_NAME,
          description: 'Emite o diagnóstico estruturado de RH.',
          input_schema: DIAGNOSTICO_TOOL_SCHEMA as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [{ role: 'user', content: JSON.stringify(input) }],
    });

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('judge did not return a tool_use block');
    }
    // validated downstream by gerarDiagnostico; cast is intentional
    return toolUse.input as Diagnostico;
  }
}
