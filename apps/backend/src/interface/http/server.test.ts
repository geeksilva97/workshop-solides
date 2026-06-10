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
