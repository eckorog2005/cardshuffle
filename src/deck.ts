import { randomInt } from 'node:crypto';

export type Random = (maxExclusive: number) => number;

const SUITS = ['H', 'S', 'C', 'D'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function standardDeck(): string[] {
  return SUITS.flatMap((suit) => VALUES.map((value) => value + suit));
}

export function shuffle<T>(cards: readonly T[], random: Random = randomInt): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i >= 1; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function repeat<T>(cards: readonly T[], times = 1): T[] {
  const result = [...cards];
  for (let i = 1; i < times; i++) {
    result.push(...cards);
  }
  return result;
}

