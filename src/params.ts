import { standardDeck } from './deck.ts';

export interface ShuffleParams {
  numDecks?: number;
  deal?: { players: number; handSize: number };
  deck?: string;
}

export type ParseResult = { params: ShuffleParams } | { error: string };

export type Query = Record<string, unknown>;

export const MAX_DECKS = 100;
export const MAX_CUSTOM_CARDS = 10_000;

const STANDARD_DECK_SIZE = standardDeck().length;

const isPositiveInteger = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9]\d*$/.test(value);

export function parseParams(query: Query, deck: unknown): ParseResult {
  const { numDecks, players, handSize } = query;

  if (numDecks !== undefined && !isPositiveInteger(numDecks)) {
    return { error: 'invalid format for number of decks' };
  }
  if (numDecks !== undefined && Number(numDecks) > MAX_DECKS) {
    return { error: `number of decks cannot be more than ${String(MAX_DECKS)}` };
  }
  if (players !== undefined && !isPositiveInteger(players)) {
    return { error: 'invalid format for number of players' };
  }
  if (players !== undefined && handSize === undefined) {
    return { error: 'in order to use number of players, you need to pass the hand size also' };
  }
  if (handSize !== undefined && !isPositiveInteger(handSize)) {
    return { error: 'invalid format for hand size' };
  }
  if (handSize !== undefined && players === undefined) {
    return { error: 'in order to use hand size, you need to pass amount of players also' };
  }
  if (deck !== undefined && typeof deck !== 'string') {
    return { error: 'invalid format for deck' };
  }

  const customDeck = deck !== undefined && deck !== '';
  const cardCount = (customDeck ? deck.split(',').length : STANDARD_DECK_SIZE) * Number(numDecks ?? 1);
  if (customDeck && cardCount > MAX_CUSTOM_CARDS) {
    return { error: `custom deck cannot have more than ${String(MAX_CUSTOM_CARDS)} cards in total` };
  }
  if (players !== undefined && handSize !== undefined && Number(players) * Number(handSize) > cardCount) {
    return { error: 'the amount of cards dealt out is greater than the deck' };
  }

  const params: ShuffleParams = {};
  if (numDecks !== undefined) {
    params.numDecks = Number(numDecks);
  }
  if (players !== undefined && handSize !== undefined) {
    params.deal = { players: Number(players), handSize: Number(handSize) };
  }
  if (customDeck) {
    params.deck = deck;
  }
  return { params };
}
