import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DeckPool, repeat, shuffle, standardDeck } from '../src/deck.ts';

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

describe('DeckPool', () => {
  test('deals one full deck by default', () => {
    const cards = new DeckPool().deal();
    assert.deepEqual(sorted(cards), sorted(standardDeck()));
  });

  test('deals several decks combined', () => {
    const cards = new DeckPool().deal(3);
    assert.equal(cards.length, 156);
    assert.deepEqual(sorted(cards), sorted(repeat(standardDeck(), 3)));
  });
});
