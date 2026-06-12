/**
 * In-memory repositories. Used as the default in services (so the route tests
 * run without a database) and as a drop-in when no DATABASE_URL is configured.
 *
 * Everything is scoped inside `createMemoryRepositories` so each app instance
 * (each test) gets an isolated store — no module-level state leaks between them.
 */
import type { Benchmark, BenchmarkSummary, Diagnostic } from "@workshop/shared";
import { CLIENT_COMPANIES, type CompanyRecord } from "@workshop/engine";
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

interface SessionEntry {
  userId: string;
  expiresAt: number;
}

interface BenchmarkEntry {
  userId: string;
  companyId: string;
  createdAt: string;
  status: "running" | "done" | "failed";
  summary: BenchmarkSummary;
  benchmark?: Benchmark;
  diagnostic?: Diagnostic;
}

export interface MemoryRepositoryOptions {
  readonly seedUsers?: readonly UserRecord[];
  readonly seedCompanies?: readonly CompanyRecord[];
}

export const createMemoryRepositories = (
  options: MemoryRepositoryOptions = {},
): Repositories => {
  const usersById = new Map<string, UserRecord>();
  const usersByEmail = new Map<string, UserRecord>();
  for (const user of options.seedUsers ?? []) {
    usersById.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user);
  }

  const users: UserRepository = {
    findByEmail: async (email) => usersByEmail.get(email.toLowerCase()),
    insert: async (user) => {
      usersById.set(user.id, user);
      usersByEmail.set(user.email.toLowerCase(), user);
    },
  };

  const sessionStore = new Map<string, SessionEntry>();
  const sessions: SessionRepository = {
    create: async (token, userId, expiresAt) => {
      sessionStore.set(token, { userId, expiresAt: expiresAt.getTime() });
    },
    findValidUser: async (token) => {
      const entry = sessionStore.get(token);
      if (entry === undefined || entry.expiresAt <= Date.now()) return undefined;
      const user = usersById.get(entry.userId);
      if (user === undefined) return undefined;
      return { id: user.id, name: user.name, email: user.email, company: user.company };
    },
    delete: async (token) => {
      sessionStore.delete(token);
    },
  };

  const companyMap = new Map(
    (options.seedCompanies ?? CLIENT_COMPANIES).map((c) => [c.id, c]),
  );
  const companies: CompanyRepository = {
    list: async () => [...companyMap.values()],
    findById: async (id) => companyMap.get(id),
  };

  const entries = new Map<string, BenchmarkEntry>();
  const benchmarks: BenchmarkRepository = {
    insert: async (row: NewBenchmarkRow) => {
      entries.set(row.id, {
        userId: row.userId,
        companyId: row.companyId,
        createdAt: row.createdAt,
        status: "running",
        summary: row.summary,
      });
    },
    complete: async (id, data: CompletedBenchmark) => {
      const entry = entries.get(id);
      if (entry === undefined) return;
      entry.status = "done";
      entry.summary = data.summary;
      entry.benchmark = data.benchmark;
      entry.diagnostic = data.diagnostic;
    },
    markFailed: async (id, message) => {
      const entry = entries.get(id);
      if (entry === undefined) return;
      entry.status = "failed";
      entry.summary = { ...entry.summary, headline: message };
    },
    failOrphaned: async () => {
      for (const entry of entries.values()) {
        if (entry.status === "running") entry.status = "failed";
      }
    },
    listByUser: async (userId) =>
      [...entries.values()].filter((e) => e.userId === userId).map((e) => e.summary),
    getState: async (id) => {
      const entry = entries.get(id);
      if (entry === undefined) return undefined;
      return {
        userId: entry.userId,
        companyId: entry.companyId,
        createdAt: entry.createdAt,
        status: entry.status,
        summary: entry.summary,
      };
    },
    getBenchmark: async (id) => entries.get(id)?.benchmark,
    getDiagnostic: async (id) => entries.get(id)?.diagnostic,
    findPrevious: async (userId, companyId, beforeCreatedAt) => {
      const prior = [...entries.values()]
        .filter(
          (e) =>
            e.userId === userId &&
            e.companyId === companyId &&
            e.status === "done" &&
            e.benchmark !== undefined &&
            e.createdAt < beforeCreatedAt,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return prior[0]?.benchmark;
    },
  };

  return { users, sessions, companies, benchmarks };
};
