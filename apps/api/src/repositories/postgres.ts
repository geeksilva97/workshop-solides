/**
 * Postgres-backed repositories (node-postgres). JSONB columns are written with
 * JSON.stringify and read back already parsed by pg. Wired in server.ts for
 * production; tests use the in-memory set instead.
 */
import type { AuthUser, Benchmark, BenchmarkSummary, Diagnostic } from "@workshop/shared";
import type { CompanyRecord } from "@workshop/engine";
import type pg from "pg";
import type {
  BenchmarkRepository,
  CompanyRepository,
  CompletedBenchmark,
  NewBenchmarkRow,
  Repositories,
  SessionRepository,
  UserRecord,
  UserRepository,
} from "./types.ts";

type DB = Pick<pg.Pool, "query">;

const companyFromRow = (row: Record<string, unknown>): CompanyRecord => ({
  id: row.id as string,
  name: row.name as string,
  anonymizedName: row.anonymized_name as string,
  setor: row.setor as string,
  porte: row.porte as string,
  uf: row.uf as string,
  regiao: row.regiao as string,
  modelo: row.modelo as string,
  description: row.description as string,
  indicators: row.indicators as CompanyRecord["indicators"],
});

export const createPostgresUserRepository = (db: DB): UserRepository => ({
  findByEmail: async (email) => {
    const { rows } = await db.query(
      "SELECT id, name, email, company, salt, hash FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    return (rows[0] as UserRecord | undefined) ?? undefined;
  },
  insert: async (user) => {
    await db.query(
      `INSERT INTO users (id, name, email, company, salt, hash)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, user.name, user.email.toLowerCase(), user.company, user.salt, user.hash],
    );
  },
});

export const createPostgresSessionRepository = (db: DB): SessionRepository => ({
  create: async (token, userId, expiresAt) => {
    await db.query(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [token, userId, expiresAt.toISOString()],
    );
  },
  findValidUser: async (token) => {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.company
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > now()`,
      [token],
    );
    return (rows[0] as AuthUser | undefined) ?? undefined;
  },
  delete: async (token) => {
    await db.query("DELETE FROM sessions WHERE token = $1", [token]);
  },
});

export const createPostgresCompanyRepository = (db: DB): CompanyRepository => ({
  list: async () => {
    const { rows } = await db.query("SELECT * FROM companies ORDER BY name");
    return rows.map(companyFromRow);
  },
  findById: async (id) => {
    const { rows } = await db.query("SELECT * FROM companies WHERE id = $1", [id]);
    return rows[0] ? companyFromRow(rows[0]) : undefined;
  },
});

export const createPostgresBenchmarkRepository = (db: DB): BenchmarkRepository => ({
  insert: async (row: NewBenchmarkRow) => {
    await db.query(
      `INSERT INTO benchmarks (id, user_id, company_id, status, created_at, filters, indicators, summary)
       VALUES ($1, $2, $3, 'running', $4, $5, $6, $7)`,
      [
        row.id,
        row.userId,
        row.companyId,
        row.createdAt,
        JSON.stringify(row.filters),
        JSON.stringify(row.indicators),
        JSON.stringify(row.summary),
      ],
    );
  },
  complete: async (id, data: CompletedBenchmark) => {
    await db.query(
      `UPDATE benchmarks
          SET status = 'done', summary = $2, benchmark = $3, diagnostic = $4
        WHERE id = $1`,
      [
        id,
        JSON.stringify(data.summary),
        JSON.stringify(data.benchmark),
        JSON.stringify(data.diagnostic),
      ],
    );
  },
  markFailed: async (id, message) => {
    await db.query(
      `UPDATE benchmarks
          SET status = 'failed',
              summary = jsonb_set(summary, '{headline}', to_jsonb($2::text))
        WHERE id = $1`,
      [id, message],
    );
  },
  failOrphaned: async () => {
    await db.query("UPDATE benchmarks SET status = 'failed' WHERE status = 'running'");
  },
  listByUser: async (userId) => {
    const { rows } = await db.query(
      "SELECT summary FROM benchmarks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return rows.map((r) => r.summary as BenchmarkSummary);
  },
  getState: async (id) => {
    const { rows } = await db.query(
      "SELECT user_id, company_id, created_at, status, summary FROM benchmarks WHERE id = $1",
      [id],
    );
    const row = rows[0];
    if (row === undefined) return undefined;
    return {
      userId: row.user_id as string,
      companyId: row.company_id as string,
      createdAt: row.created_at as string,
      status: row.status as "running" | "done" | "failed",
      summary: row.summary as BenchmarkSummary,
    };
  },
  getBenchmark: async (id) => {
    const { rows } = await db.query("SELECT benchmark FROM benchmarks WHERE id = $1", [id]);
    return rows[0]?.benchmark ? (rows[0].benchmark as Benchmark) : undefined;
  },
  getDiagnostic: async (id) => {
    const { rows } = await db.query("SELECT diagnostic FROM benchmarks WHERE id = $1", [id]);
    return rows[0]?.diagnostic ? (rows[0].diagnostic as Diagnostic) : undefined;
  },
  findPrevious: async (userId, companyId, beforeCreatedAt) => {
    const { rows } = await db.query(
      `SELECT benchmark FROM benchmarks
        WHERE user_id = $1 AND company_id = $2 AND status = 'done'
          AND created_at < $3 AND benchmark IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId, companyId, beforeCreatedAt],
    );
    return rows[0]?.benchmark ? (rows[0].benchmark as Benchmark) : undefined;
  },
});

export const createPostgresRepositories = (db: DB): Repositories => ({
  users: createPostgresUserRepository(db),
  sessions: createPostgresSessionRepository(db),
  companies: createPostgresCompanyRepository(db),
  benchmarks: createPostgresBenchmarkRepository(db),
});
