import type { Company } from '../../domain/company.ts';
import {
  type CompanyRepository,
  type Ranking,
  type SearchProfile,
  NotImplementedYetError,
} from '../../application/ports.ts';
import { POOL } from '../seed/companies.ts';

/**
 * In-memory CompanyRepository for the reference run (no Postgres needed).
 *
 * `searchDense` stands in for pgvector: it builds a multi-hot vector over the
 * union of tags and ranks the pool by cosine similarity to the profile's tags -
 * a deterministic proxy for semantic retrieval. `searchLexical` is the step-02
 * live-build stub.
 */
export class InMemoryCompanyRepository implements CompanyRepository {
  private readonly companies: Company[];

  constructor(companies: Company[] = POOL) {
    this.companies = companies;
  }

  async getById(id: string): Promise<Company | null> {
    return this.companies.find((c) => c.id === id) ?? null;
  }

  async all(): Promise<Company[]> {
    return [...this.companies];
  }

  async searchDense(profile: SearchProfile, topN: number): Promise<Ranking> {
    const vocab = this.buildVocab(profile.tags);
    const queryVec = multiHot(profile.tags, vocab);

    const scored = this.companies
      .map((c) => ({ id: c.id, score: cosine(queryVec, multiHot(c.tags, vocab)) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    return scored.map((s, i) => ({ companyId: s.id, score: s.score, rank: i + 1 }));
  }

  async searchLexical(_profile: SearchProfile, _topN: number): Promise<Ranking> {
    // LIVE-BUILD step 02 (BM25). Stays a stub until built on stage.
    throw new NotImplementedYetError('step 02 (BM25 lexical search)');
  }

  private buildVocab(extra: readonly string[]): string[] {
    const set = new Set<string>(extra);
    for (const c of this.companies) for (const t of c.tags) set.add(t);
    return [...set];
  }
}

function multiHot(tags: readonly string[], vocab: string[]): number[] {
  const present = new Set(tags);
  return vocab.map((t) => (present.has(t) ? 1 : 0));
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
