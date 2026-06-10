import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bm25, tokenize } from './bm25.ts';

test('tokenize lowercases, strips accents and drops stopwords', () => {
  assert.deepEqual(tokenize('Senior Node e TypeScript na AWS'), [
    'senior',
    'node',
    'typescript',
    'aws',
  ]);
});

test('bm25 reproduces the doc example: TF saturates, rare terms win', () => {
  // query "node" over 4 docs - doc C repeats "node" but TF saturates
  const docs = [
    { id: 'A', text: 'frontend dev react node' },
    { id: 'B', text: 'senior node typescript aws' },
    { id: 'C', text: 'node node node tutorial' },
    { id: 'D', text: 'java spring boot kafka' },
  ];
  const ranked = bm25('node', docs);

  // C ranks first (3 mentions) but not 3x A/B - saturation
  assert.equal(ranked[0]!.id, 'C');
  // D has no "node" and is filtered out
  assert.ok(!ranked.some((r) => r.id === 'D'));
  // A and B (1 mention each, same length) score equally
  const a = ranked.find((r) => r.id === 'A')!.score;
  const b = ranked.find((r) => r.id === 'B')!.score;
  assert.ok(Math.abs(a - b) < 1e-9);
  // saturation: C is less than 3x A
  assert.ok(ranked[0]!.score < 3 * a);
});
