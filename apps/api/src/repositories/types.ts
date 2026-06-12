/**
 * Repository ports. Mirrors the engine's Embedder/Reranker approach: the
 * services depend on these interfaces, production wires the Postgres-backed
 * implementations (see ./postgres.ts) and tests wire the in-memory ones (see
 * ./memory.ts) so `pnpm test` never needs a live database.
 */
import type {
  AuthUser,
  Benchmark,
  BenchmarkSummary,
  CohortFilters,
  Diagnostic,
  Indicator,
} from "@workshop/shared";
import type { CompanyRecord } from "@workshop/engine";

export interface UserRecord {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly company: string;
  readonly salt: string;
  readonly hash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | undefined>;
  insert(user: UserRecord): Promise<void>;
}

export interface SessionRepository {
  /** Persist a session token for a user, valid until `expiresAt`. */
  create(token: string, userId: string, expiresAt: Date): Promise<void>;
  /** Resolve the user behind a non-expired token, or undefined. */
  findValidUser(token: string): Promise<AuthUser | undefined>;
  delete(token: string): Promise<void>;
}

export interface CompanyRepository {
  list(): Promise<CompanyRecord[]>;
  findById(id: string): Promise<CompanyRecord | undefined>;
}

/** A freshly created benchmark row, before the pipeline has produced results. */
export interface NewBenchmarkRow {
  readonly id: string;
  readonly userId: string;
  readonly companyId: string;
  readonly createdAt: string;
  readonly filters: CohortFilters;
  readonly indicators: readonly Indicator[];
  readonly summary: BenchmarkSummary;
}

export interface CompletedBenchmark {
  readonly benchmark: Benchmark;
  readonly diagnostic: Diagnostic;
  readonly summary: BenchmarkSummary;
}

export type RunState = "running" | "done" | "failed";

/** Lightweight row state used to derive a terminal status and find prior runs. */
export interface BenchmarkState {
  readonly userId: string;
  readonly companyId: string;
  readonly createdAt: string;
  readonly status: RunState;
  readonly summary: BenchmarkSummary;
}

export interface BenchmarkRepository {
  insert(row: NewBenchmarkRow): Promise<void>;
  complete(id: string, data: CompletedBenchmark): Promise<void>;
  markFailed(id: string, message: string): Promise<void>;
  /** Mark any benchmark still "running" as failed (orphaned by a restart). */
  failOrphaned(): Promise<void>;
  listByUser(userId: string): Promise<BenchmarkSummary[]>;
  getState(id: string): Promise<BenchmarkState | undefined>;
  getBenchmark(id: string): Promise<Benchmark | undefined>;
  getDiagnostic(id: string): Promise<Diagnostic | undefined>;
  /** Most recent finished benchmark for the same company before `createdAt`. */
  findPrevious(
    userId: string,
    companyId: string,
    beforeCreatedAt: string,
  ): Promise<Benchmark | undefined>;
}

export interface Repositories {
  readonly users: UserRepository;
  readonly sessions: SessionRepository;
  readonly companies: CompanyRepository;
  readonly benchmarks: BenchmarkRepository;
}
