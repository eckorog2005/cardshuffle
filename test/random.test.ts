import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { shuffle, standardDeck } from '../src/deck.ts';
import { seededRandom } from '../src/random.ts';

const draws = (seed: string, maxExclusive: number, count: number) => {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => random(maxExclusive));
};

describe('seededRandom', () => {
  test('repeats the same sequence for the same seed', () => {
    assert.deepEqual(draws('table-7', 52, 100), draws('table-7', 52, 100));
  });

  test('gives different sequences for different seeds', () => {
    assert.notDeepEqual(draws('a', 52, 100), draws('b', 52, 100));
  });

  test('stays within range', () => {
    for (const max of [1, 2, 3, 52, 10_000]) {
      assert.ok(draws('range', max, 1000).every((value) => Number.isInteger(value) && value >= 0 && value < max));
    }
  });

  test('is roughly uniform', () => {
    const counts = Array.from({ length: 3 }, () => 0);
    for (const value of draws('uniform', 3, 30_000)) {
      counts[value]++;
    }
    assert.ok(counts.every((count) => Math.abs(count - 10_000) < 500), `counts: ${counts.join()}`);
  });

  test('gives a reproducible shuffle', () => {
    const deck = standardDeck();
    assert.deepEqual(shuffle(deck, seededRandom('replay')), shuffle(deck, seededRandom('replay')));
    assert.notDeepEqual(shuffle(deck, seededRandom('replay')), deck);
  });

  test('keeps existing seeds stable', () => {
    assert.deepEqual(shuffle(standardDeck(), seededRandom('demo')).slice(0, 6), ['2C', '9C', 'JH', 'QH', 'KC', '6H']);
  });
});
