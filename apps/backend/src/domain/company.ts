import type { Kpis } from './kpis.ts';

export type CompanySize = 'pequena' | 'media' | 'grande';

/**
 * A company in the comparison pool (or the client company). `description` is the
 * textual profile used by retrieval (dense + lexical). `tags` are a small,
 * hand-built semantic feature set the in-memory dense search uses as a stand-in
 * for real embeddings.
 */
export type Company = {
  id: string; // CNPJ-like id
  name: string;
  sector: string; // setor
  region: string; // regiao (UF / cidade)
  size: CompanySize; // porte
  description: string;
  tags: readonly string[];
  kpis: Kpis;
};
