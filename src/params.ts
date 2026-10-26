import type { FastifyError, FastifySchemaValidationError } from 'fastify';
import { standardDeck } from './deck.ts';

export interface ShuffleParams {
  numDecks?: number;
  deal?: { players: number; handSize: number };
  deck?: string[];
}

export type ParseResult = { params: ShuffleParams } | { error: string };

export interface Query {
  numDecks?: number;
  players?: number;
  handSize?: number;
}

export interface Body {
  deck?: unknown;
}

export const MAX_DECKS = 100;
export const MAX_CUSTOM_CARDS = 10_000;

type SchemaErrorDataVar = NonNullable<FastifyError['validationContext']>;

const STANDARD_DECK_SIZE = standardDeck().length;

const isCardList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');

const positiveInteger = { type: 'integer', minimum: 1 } as const;

export const querySchema = {
  type: 'object',
  properties: {
    numDecks: { ...positiveInteger, maximum: MAX_DECKS },
    players: positiveInteger,
    handSize: positiveInteger,
  },
  additionalProperties: false,
} as const;

export const bodySchema = {
  type: 'object',
  nullable: true,
  // deck is checked in toShuffleParams: Ajv's type coercion would turn "a,b" into ["a,b"] and 5 into ["5"].
  properties: {
    deck: {},
  },
  additionalProperties: false,
} as const;

const integerRules: Record<string, string> = {
  numDecks: `a whole number from 1 to ${String(MAX_DECKS)}`,
  players: 'a positive whole number',
  handSize: 'a positive whole number',
};

function describeSchemaError(error: FastifySchemaValidationError, dataVar: SchemaErrorDataVar): string {
  const field = error.instancePath.slice(1);
  if (error.keyword === 'additionalProperties') {
    const name = String(error.params.additionalProperty);
    return dataVar === 'querystring' ? `unknown query parameter "${name}"` : `unknown field "${name}" in request body`;
  }
  if (field in integerRules) {
    return `${field} must be ${integerRules[field]}`;
  }
  if (field === '' && dataVar === 'body') {
    return 'request body must be an object';
  }
  return `${field || dataVar} ${error.message ?? 'is invalid'}`;
}

export function formatSchemaErrors(errors: FastifySchemaValidationError[], dataVar: SchemaErrorDataVar): Error {
  return new Error(describeSchemaError(errors[0], dataVar));
}

export function toShuffleParams({ numDecks, players, handSize }: Query, deck: unknown): ParseResult {
  if ((players === undefined) !== (handSize === undefined)) {
    return { error: 'players and handSize must be given together' };
  }
  if (deck !== undefined && !isCardList(deck)) {
    return { error: 'deck must be a non-empty array of strings' };
  }

  const customDeck = deck?.map((card) => card.trim());
  if (customDeck?.includes('')) {
    return { error: 'deck cannot contain empty cards' };
  }
  const cardCount = (customDeck?.length ?? STANDARD_DECK_SIZE) * (numDecks ?? 1);
  if (customDeck && cardCount > MAX_CUSTOM_CARDS) {
    return {
      error: `deck cannot have more than ${String(MAX_CUSTOM_CARDS)} cards in total, but ${String(customDeck.length)} cards × ${String(numDecks ?? 1)} decks is ${String(cardCount)}`,
    };
  }

  const params: ShuffleParams = {};
  if (numDecks !== undefined) {
    params.numDecks = numDecks;
  }
  if (players !== undefined && handSize !== undefined) {
    const dealt = players * handSize;
    if (dealt > cardCount) {
      return {
        error: `cannot deal ${String(dealt)} cards (${String(players)} players × ${String(handSize)}) from a deck of ${String(cardCount)}`,
      };
    }
    params.deal = { players, handSize };
  }
  if (customDeck) {
    params.deck = customDeck;
  }
  return { params };
}
