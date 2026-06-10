import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rate, enps, days, InvalidIndicatorError } from './indicator.ts';
import { makeKpis } from './kpis.ts';

test('rate accepts a percentage in [0,100] and rejects out-of-range', () => {
  assert.equal(rate(12.5), 12.5);
  assert.throws(() => rate(-1), InvalidIndicatorError);
  assert.throws(() => rate(101), InvalidIndicatorError);
});

test('enps accepts [-100,100], days must be positive', () => {
  assert.equal(enps(-5), -5);
  assert.throws(() => enps(-101), InvalidIndicatorError);
  assert.throws(() => days(0), InvalidIndicatorError);
});

test('makeKpis enforces every indicator invariant', () => {
  const k = makeKpis({ turnover_voluntario: 28.4, absenteismo: 5.2, time_to_hire: 32, enps: -5 });
  assert.equal(k.turnover_voluntario, 28.4);
  assert.throws(
    () => makeKpis({ turnover_voluntario: 200, absenteismo: 5, time_to_hire: 32, enps: 0 }),
    InvalidIndicatorError,
  );
});
