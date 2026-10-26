import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { parseParams } from '../src/params.ts';

const repeatCards = (count: number) => Array.from({ length: count }, () => 'x').join();

describe('parseParams', () => {
  test('accepts an empty query', () => {
    assert.deepEqual(parseParams({}, undefined), { params: {} });
  });

  test('parses numeric options', () => {
    assert.deepEqual(parseParams({ numDecks: '2', players: '4', handSize: '5' }, undefined), {
      params: { numDecks: 2, deal: { players: 4, handSize: 5 } },
    });
  });

  test('accepts the maximum number of decks and cards', () => {
    assert.deepEqual(parseParams({ numDecks: '100' }, undefined), { params: { numDecks: 100 } });
    assert.deepEqual(parseParams({ numDecks: '2' }, repeatCards(5000)), {
      params: { numDecks: 2, deck: repeatCards(5000) },
    });
  });

  test('keeps a custom deck and ignores an empty one', () => {
    assert.deepEqual(parseParams({}, 'a,b'), { params: { deck: 'a,b' } });
    assert.deepEqual(parseParams({}, ''), { params: {} });
  });

  const errors: [string, Record<string, unknown>, unknown, string][] = [
    ['non-numeric numDecks', { numDecks: 'abc' }, undefined, 'invalid format for number of decks'],
    ['empty numDecks', { numDecks: '' }, undefined, 'invalid format for number of decks'],
    ['zero numDecks', { numDecks: '0' }, undefined, 'invalid format for number of decks'],
    ['fractional numDecks', { numDecks: '1.5' }, undefined, 'invalid format for number of decks'],
    ['more than 100 decks', { numDecks: '101' }, undefined, 'number of decks cannot be more than 100'],
    ['repeated numDecks', { numDecks: ['1', '2'] }, undefined, 'invalid format for number of decks'],
    ['non-numeric players', { players: 'x', handSize: '5' }, undefined, 'invalid format for number of players'],
    [
      'players without handSize',
      { players: '4' },
      undefined,
      'in order to use number of players, you need to pass the hand size also',
    ],
    ['negative handSize', { players: '4', handSize: '-1' }, undefined, 'invalid format for hand size'],
    [
      'handSize without players',
      { handSize: '5' },
      undefined,
      'in order to use hand size, you need to pass amount of players also',
    ],
    ['non-string deck', {}, ['a', 'b'], 'invalid format for deck'],
    [
      'a custom deck over the card limit',
      { numDecks: '2' },
      repeatCards(5001),
      'custom deck cannot have more than 10000 cards in total',
    ],
  ];

  for (const [name, query, deck, error] of errors) {
    test(`rejects ${name}`, () => {
      assert.deepEqual(parseParams(query, deck), { error });
    });
  }
});
