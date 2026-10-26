import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { describe, test } from 'node:test';
import { deal, shuffleRequest } from '../src/shuffle.ts';

describe('deal', () => {
  const cards = ['1', '2', '3', '4', '5', '6', '7'];

  test('deals round-robin and returns the rest as the deck', () => {
    assert.deepEqual(deal(cards, 2, 3), {
      hands: [
        ['1', '3', '5'],
        ['2', '4', '6'],
      ],
      deck: ['7'],
    });
  });

  test('can deal the whole deck', () => {
    assert.deepEqual(deal(cards, 7, 1), { hands: [['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7']], deck: [] });
  });

  test('refuses to deal more cards than the deck holds', () => {
    assert.throws(() => deal(cards, 4, 2), RangeError);
  });
});

describe('shuffleRequest', () => {
  test('returns a standard deck and no hands by default', () => {
    const result = shuffleRequest({}, randomInt);
    assert.deepEqual(result.hands, []);
    assert.equal(result.deck.length, 52);
  });

  test('repeats a custom deck numDecks times', () => {
    const result = shuffleRequest({ deck: ['a', 'b', 'c'], numDecks: 2 }, randomInt);
    assert.deepEqual(result.deck.sort(), ['a', 'a', 'b', 'b', 'c', 'c']);
  });

  test('keeps cards that contain commas intact', () => {
    const result = shuffleRequest({ deck: ['a,b', 'c'] }, randomInt);
    assert.deepEqual(result.deck.sort(), ['a,b', 'c']);
  });

  test('deals hands from the shuffled deck', () => {
    const result = shuffleRequest({ deal: { players: 4, handSize: 5 } }, randomInt);
    assert.equal(result.hands.length, 4);
    for (const hand of result.hands) {
      assert.equal(hand.length, 5);
    }
    assert.equal(result.deck.length, 32);
  });
});
