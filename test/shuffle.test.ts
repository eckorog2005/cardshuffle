import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DeckPool } from '../src/deck.ts';
import { deal, shuffleRequest } from '../src/shuffle.ts';

describe('deal', () => {
  const cards = ['1', '2', '3', '4', '5', '6', '7'];

  test('deals round-robin and returns the rest as the deck', () => {
    assert.deepEqual(deal(cards, 2, 3), { hands: ['1,3,5', '2,4,6'], deck: '7' });
  });

  test('can deal the whole deck', () => {
    assert.deepEqual(deal(cards, 7, 1), { hands: ['1', '2', '3', '4', '5', '6', '7'], deck: '' });
  });

  test('refuses to deal more cards than the deck holds', () => {
    assert.throws(() => deal(cards, 4, 2), RangeError);
  });
});

describe('shuffleRequest', () => {
  const pool = new DeckPool();

  test('returns a standard deck by default', () => {
    const result = shuffleRequest({}, pool, Math.random);
    assert.ok('deck' in result && !('hands' in result));
    assert.equal(result.deck.split(',').length, 52);
  });

  test('repeats a custom deck numDecks times', () => {
    const result = shuffleRequest({ deck: 'a,b,c', numDecks: 2 }, pool, Math.random);
    assert.ok('deck' in result);
    assert.deepEqual(result.deck.split(',').sort(), ['a', 'a', 'b', 'b', 'c', 'c']);
  });

  test('deals hands from the shuffled deck', () => {
    const result = shuffleRequest({ deal: { players: 4, handSize: 5 } }, pool, Math.random);
    assert.ok('hands' in result);
    assert.equal(result.hands.length, 4);
    for (const hand of result.hands) {
      assert.equal(hand.split(',').length, 5);
    }
    assert.equal(result.deck.split(',').length, 32);
  });
});
