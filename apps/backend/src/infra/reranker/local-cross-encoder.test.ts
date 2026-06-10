import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalCrossEncoderReranker } from './local-cross-encoder.ts';

test('reranker scores the relevant pair higher than the irrelevant one', async () => {
  const reranker = new LocalCrossEncoderReranker();
  const query = 'tecnologia saas b2b plataforma para PMEs engenharia de produto';
  const scored = await reranker.rerank(query, [
    { id: 'relevant', text: 'plataforma saas b2b de produto para PMEs, engenharia' },
    { id: 'irrelevant', text: 'transportadora e operadora logistica de grande porte' },
  ]);

  assert.equal(scored[0]!.id, 'relevant');
  assert.ok(scored[0]!.score > scored[1]!.score);
});
