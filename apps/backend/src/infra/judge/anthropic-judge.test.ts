import { test } from 'node:test';
import assert from 'node:assert/strict';
import type Anthropic from '@anthropic-ai/sdk';
import { AnthropicJudge } from './anthropic-judge.ts';
import type { DiagnosisInput } from '../../application/ports.ts';

const input: DiagnosisInput = { empresa: 'X', setor: 'tecnologia', kpis: [] };

const validOutput = {
  diagnostico_principal: 'Problema de retenção.',
  indicadores_criticos: [{ kpi: 'turnover_voluntario', leitura: 'No p95.', severidade: 'alta' }],
  hipoteses: ['onboarding'],
  proxima_acao: 'pesquisa de saída',
};

test('AnthropicJudge forces the tool and returns its input (client mocked)', async () => {
  let captured: Record<string, unknown> | undefined;
  const fakeClient = {
    messages: {
      create: async (params: Record<string, unknown>) => {
        captured = params;
        return { content: [{ type: 'tool_use', id: 't1', name: 'emitir_diagnostico', input: validOutput }] };
      },
    },
  } as unknown as Anthropic;

  const judge = new AnthropicJudge(fakeClient);
  const result = await judge.diagnose(input);

  assert.deepEqual(result, validOutput);
  // it forced the tool, not free text
  assert.deepEqual(captured?.tool_choice, { type: 'tool', name: 'emitir_diagnostico' });
});

test('AnthropicJudge throws if the model returns no tool_use block', async () => {
  const fakeClient = {
    messages: {
      create: async () => ({ content: [{ type: 'text', text: 'oops' }] }),
    },
  } as unknown as Anthropic;

  await assert.rejects(() => new AnthropicJudge(fakeClient).diagnose(input));
});
