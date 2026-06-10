import Fastify, { type FastifyInstance } from 'fastify';

/**
 * Composition of the HTTP interface layer.
 *
 * This is where transport-level concerns live: routing, serialization, request
 * validation. Routes adapt HTTP into calls to the application layer - they hold
 * no business rules themselves.
 */
export function buildServer(): FastifyInstance {
  const server = Fastify({
    logger: true,
  });

  server.get('/health', async () => ({ status: 'ok' }));

  return server;
}
