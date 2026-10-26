import { repeat, shuffle, type DeckPool, type Random } from './deck.ts';
import type { ShuffleParams } from './params.ts';

export type ShuffleResponse = { deck: string } | { hands: string[]; deck: string } | { error: string };

export function shuffleRequest(params: ShuffleParams, pool: DeckPool, random: Random): ShuffleResponse {
  const cards =
    params.deck === undefined
      ? pool.deal(params.numDecks)
      : shuffle(repeat(params.deck.split(','), params.numDecks), random);

  if (params.deal === undefined) {
    return { deck: cards.join() };
  }
  return deal(cards, params.deal.players, params.deal.handSize);
}

export function deal(cards: readonly string[], players: number, handSize: number): ShuffleResponse {
  if (players * handSize > cards.length) {
    return { error: 'the amount of cards dealt out is greater than the deck' };
  }

  const hands = Array.from({ length: players }, (): string[] => []);
  let next = 0;
  for (let round = 0; round < handSize; round++) {
    for (const hand of hands) {
      hand.push(cards[next++]);
    }
  }
  return { hands: hands.map((hand) => hand.join()), deck: cards.slice(next).join() };
}
