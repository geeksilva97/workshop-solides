import { buildServer } from './interface/http/server.ts';

const PORT = Number(process.env.PORT ?? 3333);

const server = buildServer();

try {
  await server.listen({ port: PORT, host: '0.0.0.0' });
  server.log.info(`Tom Ranks API listening on :${PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
