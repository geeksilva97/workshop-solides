/**
 * Lazily-created shared pg connection pool. The api has no build step, so this
 * is plain runtime config keyed off DATABASE_URL (loaded via `node --env-file`).
 */
import pg from "pg";

let pool: pg.Pool | undefined;

export const getPool = (
  connectionString: string | undefined = process.env.DATABASE_URL,
): pg.Pool => {
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error(
      "DATABASE_URL is not set. Start Postgres (docker compose up -d) and pass --env-file=.env.",
    );
  }
  pool ??= new pg.Pool({ connectionString });
  return pool;
};

export const closePool = async (): Promise<void> => {
  await pool?.end();
  pool = undefined;
};
