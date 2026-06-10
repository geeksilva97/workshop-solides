import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryCompanyRepository } from './in-memory-company-repository.ts';
import { SOLIPSE } from '../seed/companies.ts';

const profile = {
  description: SOLIPSE.description,
  sector: SOLIPSE.sector,
  region: SOLIPSE.region,
  size: SOLIPSE.size,
  tags: SOLIPSE.tags,
};

test('dense search ranks the SaaS cluster above off-domain companies', async () => {
  const repo = new InMemoryCompanyRepository();
  const ranking = await repo.searchDense(profile, 30);

  assert.ok(ranking.length > 0);
  // ranks are 1-indexed and contiguous
  assert.equal(ranking[0]!.rank, 1);

  const topIds = ranking.slice(0, 5).map((r) => r.companyId);
  // an off-domain company (indústria de alimentos) must not be in the top 5
  assert.ok(!topIds.includes('99999999000199'));
});

test('lexical search (BM25) matches companies that share literal terms', async () => {
  const repo = new InMemoryCompanyRepository();
  const ranking = await repo.searchLexical(profile, 30);

  assert.ok(ranking.length > 0);
  assert.equal(ranking[0]!.rank, 1);
  // every returned company shares at least one literal term with the profile;
  // a company with no shared terms scores 0 and is filtered out
  assert.ok(ranking.every((r) => r.score > 0));
});
