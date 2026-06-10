import type { Company, CompanySize } from '../domain/company.ts';

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

/** Thrown by stubs that belong to a live-build step not yet implemented. */
export class NotImplementedYetError extends Error {
  constructor(step: string) {
    super(`not implemented yet - live-build ${step}`);
    this.name = 'NotImplementedYetError';
  }
}
