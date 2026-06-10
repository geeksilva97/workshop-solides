import type { Company, CompanySize } from '../domain/company.ts';
import type { Diagnostico } from '../domain/diagnostico.ts';
import type { KpiPercentile } from './percentis.ts';

/** One entry of a ranking produced by a retrieval mechanism. */
export type RankEntry = { companyId: string; score: number; rank: number };
export type Ranking = RankEntry[];

/** The structured profile a search is run against (the client company). */
export type SearchProfile = {
  description: string;
  sector: string;
  region: string;
  size: CompanySize;
  tags: readonly string[];
};

/**
 * Port the application owns; infra implements it (in-memory here, Postgres +
 * pgvector in production). Inner layers never import a concrete adapter.
 */
export interface CompanyRepository {
  getById(id: string): Promise<Company | null>;
  all(): Promise<Company[]>;

  /** Dense (semantic) retrieval - prebuilt. Returns top-N by meaning. */
  searchDense(profile: SearchProfile, topN: number): Promise<Ranking>;

  /** Lexical (BM25-style) retrieval - LIVE-BUILD step 02. */
  searchLexical(profile: SearchProfile, topN: number): Promise<Ranking>;
}

/** A (id, score) pair, e.g. a reranker verdict for one candidate. */
export type Scored = { id: string; score: number };

/**
 * Reranker port - a cross-encoder that scores each (query, document) pair
 * jointly. Implemented in production by Cohere Rerank / BGE; here by a local
 * deterministic stand-in. The application never knows which.
 */
export interface Reranker {
  rerank(query: string, docs: { id: string; text: string }[]): Promise<Scored[]>;
}

/** What the judge reasons over: the client company + its KPI percentiles. */
export type DiagnosisInput = {
  empresa: string;
  setor: string;
  kpis: KpiPercentile[];
};

/**
 * Judge port - turns the cold percentiles into an actionable diagnosis. The
 * production adapter forces a schema via Anthropic tool use; the application
 * re-validates whatever comes back.
 */
export interface Judge {
  diagnose(input: DiagnosisInput): Promise<Diagnostico>;
}

/** Thrown by stubs that belong to a live-build step not yet implemented. */
export class NotImplementedYetError extends Error {
  constructor(step: string) {
    super(`not implemented yet - live-build ${step}`);
    this.name = 'NotImplementedYetError';
  }
}
