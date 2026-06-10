import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hybridSearch } from './hybrid-search.ts';
import { InMemoryCompanyRepository } from '../../infra/db/in-memory-company-repository.ts';
import { SOLIPSE } from '../../infra/seed/companies.ts';

const profile = {
  description: SOLIPSE.description,
  sector: SOLIPSE.sector,
  region: SOLIPSE.region,
  size: SOLIPSE.size,
  tags: SOLIPSE.tags,
};

test('hybridSearch fuses dense + lexical via RRF (no longer a stub)', async () => {
  const repo = new InMemoryCompanyRepository();
  const fused = await hybridSearch(repo, profile);

  assert.ok(fused.length > 0);
  assert.equal(fused[0]!.rank, 1);
  // the SaaS cluster should dominate the top of the fused ranking
  const topIds = fused.slice(0, 5).map((f) => f.companyId);
  assert.ok(!topIds.includes('99999999000199')); // off-domain alimentos
});
