import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PgCompanyRepository } from './pg-company-repository.ts';

// Integration test against the restored dump. Skips unless DATABASE_URL is set,
// so the suite stays green where no Postgres is available.
const DB = process.env.DATABASE_URL;

test('PgCompanyRepository: dense + lexical against the real dump', { skip: !DB }, async () => {
  const repo = new PgCompanyRepository(DB!);
  try {
    const solipse = await repo.getById('client-solipse');
    assert.ok(solipse, 'Solípse must exist in the dump');
    assert.equal(solipse!.kpis.turnover_voluntario, 28.4);
    assert.equal(solipse!.kpis.enps, -5);

    const all = await repo.all();
    assert.equal(all.length, 107);

    const profile = {
      description: solipse!.description,
      sector: solipse!.sector,
      region: solipse!.region,
      size: solipse!.size,
      tags: solipse!.tags,
    };

    const dense = await repo.searchDense(profile, 10);
    assert.ok(dense.length > 0);
    assert.equal(dense[0]!.rank, 1);
    // top dense hit is a real tech company (Sólides), not Solípse itself
    assert.notEqual(dense[0]!.companyId, 'client-solipse');

    const lexical = await repo.searchLexical(profile, 10);
    assert.ok(lexical.length > 0, 'lexical should match tech companies');
    assert.ok(lexical.every((r) => r.score > 0));
  } finally {
    await repo.close();
  }
});
