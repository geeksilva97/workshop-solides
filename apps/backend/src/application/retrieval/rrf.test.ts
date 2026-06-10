import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rrf } from './rrf.ts';
import type { Ranking } from '../ports.ts';

function ranking(ids: string[]): Ranking {
  return ids.map((companyId, i) => ({ companyId, score: 0, rank: i + 1 }));
}

test('rrf reproduces the doc example - A wins by being good in both', () => {
  const dense = ranking(['A', 'B', 'D', 'C', 'E']);
  const bm25 = ranking(['C', 'A', 'E', 'B', 'D']);

  const fused = rrf([dense, bm25]);

  assert.equal(fused[0]!.companyId, 'A'); // 1st dense, 2nd bm25
  assert.equal(fused[1]!.companyId, 'C'); // 1st bm25, 4th dense
  // ranks are 1-indexed and contiguous
  assert.deepEqual(
    fused.map((f) => f.rank),
    [1, 2, 3, 4, 5],
  );
});

test('an item present in only one ranking still scores, but lower', () => {
  const a = ranking(['X', 'Y']);
  const b = ranking(['X']); // Y missing here
  const fused = rrf([a, b]);
  assert.equal(fused[0]!.companyId, 'X');
  assert.ok(fused[0]!.score > fused[1]!.score);
});
