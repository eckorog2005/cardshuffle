import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { toShuffleParams } from '../src/params.ts';

const repeatCards = (count: number) => Array.from({ length: count }, () => 'x');

describe('toShuffleParams', () => {
  test('accepts an empty query', () => {
    assert.deepEqual(toShuffleParams({}, undefined), { params: {} });
  });

  test('passes numeric options through', () => {
    assert.deepEqual(toShuffleParams({ numDecks: 2, players: 4, handSize: 5 }, undefined), {
      params: { numDecks: 2, deal: { players: 4, handSize: 5 } },
    });
  });

  test('accepts the maximum number of custom cards', () => {
    assert.deepEqual(toShuffleParams({ numDecks: 2 }, repeatCards(5000)), {
      params: { numDecks: 2, deck: repeatCards(5000) },
    });
  });

  test('allows dealing exactly the whole deck', () => {
    assert.deepEqual(toShuffleParams({ players: 4, handSize: 13 }, undefined), {
      params: { deal: { players: 4, handSize: 13 } },
    });
    assert.deepEqual(toShuffleParams({ numDecks: 2, players: 2, handSize: 3 }, ['a', 'b', 'c']), {
      params: { numDecks: 2, deal: { players: 2, handSize: 3 }, deck: ['a', 'b', 'c'] },
    });
    assert.ok('params' in toShuffleParams({ numDecks: 2, players: 8, handSize: 13 }, undefined));
  });

  test('keeps a custom deck', () => {
    assert.deepEqual(toShuffleParams({}, ['a', 'b']), { params: { deck: ['a', 'b'] } });
  });

  test('keeps commas inside custom cards', () => {
    assert.deepEqual(toShuffleParams({}, ['a,b', 'c']), { params: { deck: ['a,b', 'c'] } });
  });

  test('trims whitespace around custom cards', () => {
    assert.deepEqual(toShuffleParams({}, [' a ', ' b\t', 'c ']), { params: { deck: ['a', 'b', 'c'] } });
  });

  const deckFormat = 'deck must be a non-empty array of strings';
  const errors: [string, Parameters<typeof toShuffleParams>[0], unknown, string][] = [
    ['players without handSize', { players: 4 }, undefined, 'players and handSize must be given together'],
    ['handSize without players', { handSize: 5 }, undefined, 'players and handSize must be given together'],
    ['a comma-separated string deck', {}, 'a,b', deckFormat],
    ['an empty deck', {}, [], deckFormat],
    ['a null deck', {}, null, deckFormat],
    ['an object deck', {}, { a: 'b' }, deckFormat],
    ['a deck with a non-string card', {}, ['a', 1], deckFormat],
    ['a deck with a nested array', {}, ['a', ['b']], deckFormat],
    ['a deck with a null card', {}, ['a', null], deckFormat],
    ['an empty card in a custom deck', {}, ['a', '', 'b'], 'deck cannot contain empty cards'],
    ['a blank card in a custom deck', {}, ['a', ' \t', 'b'], 'deck cannot contain empty cards'],
    [
      'dealing more than a standard deck',
      { players: 11, handSize: 5 },
      undefined,
      'cannot deal 55 cards (11 players × 5) from a deck of 52',
    ],
    [
      'dealing more than a custom deck',
      { players: 2, handSize: 2 },
      ['a', 'b', 'c'],
      'cannot deal 4 cards (2 players × 2) from a deck of 3',
    ],
    [
      'a custom deck over the card limit',
      { numDecks: 2 },
      repeatCards(5001),
      'deck cannot have more than 10000 cards in total, but 5001 cards × 2 decks is 10002',
    ],
  ];

  for (const [name, query, deck, error] of errors) {
    test(`rejects ${name}`, () => {
      assert.deepEqual(toShuffleParams(query, deck), { error });
    });
  }
});
