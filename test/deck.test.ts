import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { repeat, shuffle, standardDeck } from '../src/deck.ts';

const sorted = (cards: readonly string[]) => [...cards].sort();

describe('standardDeck', () => {
  test('has 52 unique cards', () => {
    const deck = standardDeck();
    assert.equal(deck.length, 52);
    assert.equal(new Set(deck).size, 52);
  });

  test('uses value-then-suit codes', () => {
    const deck = standardDeck();
    assert.ok(deck.includes('10H'));
    assert.ok(deck.includes('AS'));
    assert.ok(deck.includes('KD'));
  });
});

describe('shuffle', () => {
  test('returns a permutation of the input', () => {
    const deck = standardDeck();
    assert.deepEqual(sorted(shuffle(deck)), sorted(deck));
  });

  test('does not mutate the input', () => {
    const deck = standardDeck();
    const copy = [...deck];
    shuffle(deck);
    assert.deepEqual(deck, copy);
  });

  // A uniform shuffle must be able to leave a card where it was; Sattolo's
  // variant (random index below i) never can.
  test('can leave cards in their original position', () => {
    const highest = (maxExclusive: number) => maxExclusive - 1;
    assert.deepEqual(shuffle(['a', 'b', 'c', 'd'], highest), ['a', 'b', 'c', 'd']);
  });

  test('handles empty and single-card decks', () => {
    assert.deepEqual(shuffle([]), []);
    assert.deepEqual(shuffle(['AH']), ['AH']);
  });
});

describe('repeat', () => {
  test('concatenates the deck the given number of times', () => {
    assert.deepEqual(repeat(['a', 'b'], 3), ['a', 'b', 'a', 'b', 'a', 'b']);
  });

  test('defaults to a single copy', () => {
    assert.deepEqual(repeat(['a', 'b']), ['a', 'b']);
  });
});
