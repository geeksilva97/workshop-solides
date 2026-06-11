import { Pool } from 'pg';
import type { Company, CompanySize } from '../../domain/company.ts';
import { makeKpis, type Kpis } from '../../domain/kpis.ts';
import type { CompanyRepository, Ranking, SearchProfile } from '../../application/ports.ts';

/**
 * Postgres + pgvector implementation of CompanyRepository, backed by the real
 * dump (107 companies with 1024-dim embeddings + a generated `profile_tsv`).
 *
 * - searchDense  -> cosine distance via the pgvector `<=>` operator
 * - searchLexical-> BM25-style lexical rank via `ts_rank_cd` over `profile_tsv`
 *
 * Same port as InMemoryCompanyRepository; swapping this in is the only change
 * the application sees. The dump's kpis jsonb uses different key names, mapped
 * here to the domain Kpis.
 */

type DbKpis = {
  voluntary_turnover: number;
  absenteeism: number;
  time_to_hire: number;
  enps: number;
};

function mapKpis(raw: DbKpis): Kpis {
  return makeKpis({
    turnover_voluntario: raw.voluntary_turnover,
    absenteismo: raw.absenteeism,
    time_to_hire: raw.time_to_hire,
    enps: raw.enps,
  });
}

// The dump has no size/region columns; derive light values from the profile so
// the domain Company stays well-formed. Retrieval uses embedding + tsvector,
// not these, so a reasonable default is fine.
function inferSize(): CompanySize {
  return 'media';
}
function inferRegion(profile: string): string {
  const m = profile.match(/\(([A-Z]{2})\)/);
  return m ? m[1]! : 'BR';
}

type Row = { id: string; name: string; sector: string; profile: string; kpis: DbKpis };

function toCompany(r: Row): Company {
  return {
    id: r.id,
    name: r.name,
    sector: r.sector,
    region: inferRegion(r.profile),
    size: inferSize(),
    description: r.profile,
    tags: [],
    kpis: mapKpis(r.kpis),
  };
}

export class PgCompanyRepository implements CompanyRepository {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getById(id: string): Promise<Company | null> {
    const { rows } = await this.pool.query<Row>(
      'select id, name, sector, profile, kpis from companies where id = $1',
      [id],
    );
    return rows[0] ? toCompany(rows[0]) : null;
  }

  async all(): Promise<Company[]> {
    const { rows } = await this.pool.query<Row>('select id, name, sector, profile, kpis from companies');
    return rows.map(toCompany);
  }

  async searchDense(profile: SearchProfile, topN: number): Promise<Ranking> {
    // Cosine similarity against the query company's stored embedding. We resolve
    // the query embedding by matching the profile text (the client company is in
    // the pool), then rank everyone else by `<=>` (cosine distance).
    const { rows } = await this.pool.query<{ id: string; score: number }>(
      `with q as (select embedding from companies where profile = $1 limit 1)
       select c.id, 1 - (c.embedding <=> q.embedding) as score
       from companies c, q
       where c.profile <> $1
       order by c.embedding <=> q.embedding
       limit $2`,
      [profile.description, topN],
    );
    return rows.map((r, i) => ({ companyId: r.id, score: Number(r.score), rank: i + 1 }));
  }

  async searchLexical(profile: SearchProfile, topN: number): Promise<Ranking> {
    // BM25-style lexical rank over the generated tsvector. Terms are OR-joined
    // (a company need only share some terms), ranked by ts_rank_cd.
    const terms = [profile.sector, profile.region, ...profile.tags, ...profile.description.split(/\s+/)]
      .map((t) => t.toLowerCase().replace(/[^a-z0-9á-ú]/gi, ''))
      .filter((t) => t.length > 2);
    const tsquery = [...new Set(terms)].join(' | ');
    if (!tsquery) return [];

    const { rows } = await this.pool.query<{ id: string; score: number }>(
      `select c.id, ts_rank_cd(c.profile_tsv, q) as score
       from companies c, to_tsquery('portuguese', $1) q
       where c.profile <> $2 and c.profile_tsv @@ q
       order by score desc
       limit $3`,
      [tsquery, profile.description, topN],
    );
    return rows.map((r, i) => ({ companyId: r.id, score: Number(r.score), rank: i + 1 }));
  }
}
