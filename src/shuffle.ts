import { repeat, shuffle, standardDeck, type Random } from './deck.ts';
import type { ShuffleParams } from './params.ts';

export interface ShuffleResponse {
  hands: string[][];
  deck: string[];
}

export function shuffleRequest(params: ShuffleParams, random: Random): ShuffleResponse {
  const deck = params.deck ?? standardDeck();
  const cards = shuffle(repeat(deck, params.numDecks), random);

  if (params.deal === undefined) {
    return { hands: [], deck: cards };
  }
  return deal(cards, params.deal.players, params.deal.handSize);
}

export function deal(cards: readonly string[], players: number, handSize: number): ShuffleResponse {
  if (players * handSize > cards.length) {
    throw new RangeError(`cannot deal ${String(players * handSize)} cards from a deck of ${String(cards.length)}`);
  }

  const hands = Array.from({ length: players }, (): string[] => []);
  let next = 0;
  for (let round = 0; round < handSize; round++) {
    for (const hand of hands) {
      hand.push(cards[next++]);
    }
  }
  return { hands, deck: cards.slice(next) };
}
