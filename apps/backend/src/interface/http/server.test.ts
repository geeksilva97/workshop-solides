import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from './server.ts';

test('GET /health returns ok', async () => {
  const server = buildServer();
  const response = await server.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });

  await server.close();
});

test('GET /benchmark/solipse runs the pipeline and returns a diagnosis', async () => {
  const server = buildServer();
  const response = await server.inject({ method: 'GET', url: '/benchmark/solipse' });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.empresa, 'Solípse Tecnologia');
  assert.ok(Array.isArray(body.cohort) && body.cohort.length >= 5);
  assert.ok(body.diagnostico.diagnostico_principal.length > 0);

  await server.close();
});
