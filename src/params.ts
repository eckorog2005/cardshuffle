import type { FastifyError, FastifySchemaValidationError } from 'fastify';
import { JOKER, standardDeck } from './deck.ts';

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
  seed?: string;
  jokers?: number;
  exclude?: string;
}

export interface Body {
  deck?: unknown;
}

export const MAX_DECKS = 100;
export const MAX_CUSTOM_CARDS = 10_000;
export const MAX_SEED_LENGTH = 128;
export const MAX_JOKERS = 2;

type SchemaErrorDataVar = NonNullable<FastifyError['validationContext']>;

const STANDARD_DECK_SIZE = standardDeck().length;
const STANDARD_CARDS = new Set(standardDeck());

const isCardList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string');

// Ajv's coercion accepts anything Number() parses ("1e1", "0x10", " 5"), so require plain digits before coercing.
const positiveInteger = (description: string, maximum?: number) => ({
  description,
  allOf: [
    { type: 'string', pattern: '^[1-9][0-9]*$' },
    { type: 'integer', minimum: 1, ...(maximum === undefined ? {} : { maximum }) },
  ],
});

export const querySchema = {
  type: 'object',
  properties: {
    numDecks: positiveInteger('Number of decks to shuffle together.', MAX_DECKS),
    players: positiveInteger('Number of hands to deal. Requires handSize.'),
    handSize: positiveInteger('Number of cards in each hand. Requires players.'),
    seed: {
      type: 'string',
      minLength: 1,
      maxLength: MAX_SEED_LENGTH,
      description: 'Makes the shuffle reproducible: the same seed and options always give the same result.',
    },
    jokers: positiveInteger('Jokers (JK) to add to each standard deck.', MAX_JOKERS),
    exclude: {
      type: 'string',
      minLength: 1,
      maxLength: 512,
      description: 'Comma-separated standard cards to remove from each deck, e.g. 2H,2S,2C,2D.',
    },
  },
  additionalProperties: false,
} as const;

export const bodySchema = {
  type: 'object',
  nullable: true,
  // deck is checked in toShuffleParams: Ajv's type coercion would turn "a,b" into ["a,b"] and 5 into ["5"].
  properties: {
    deck: { description: 'Cards to shuffle, e.g. ["one","two","three"]. Commas inside cards are kept.' },
  },
  additionalProperties: false,
} as const;

export const deckDocsSchema = { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } as const;

const fieldRules: Record<string, string> = {
  numDecks: `a whole number from 1 to ${String(MAX_DECKS)}`,
  players: 'a positive whole number',
  handSize: 'a positive whole number',
  seed: `a string of 1 to ${String(MAX_SEED_LENGTH)} characters`,
  jokers: `a whole number from 1 to ${String(MAX_JOKERS)}`,
  exclude: 'a comma-separated list of cards, such as 2H,2S',
};

function describeSchemaError(error: FastifySchemaValidationError, dataVar: SchemaErrorDataVar): string {
  const field = error.instancePath.slice(1);
  if (error.keyword === 'additionalProperties') {
    const name = String(error.params.additionalProperty);
    return dataVar === 'querystring' ? `unknown query parameter "${name}"` : `unknown field "${name}" in request body`;
  }
  if (field in fieldRules) {
    return `${field} must be ${fieldRules[field]}`;
  }
  if (field === '' && dataVar === 'body') {
    return 'request body must be an object';
  }
  return `${field || dataVar} ${error.message ?? 'is invalid'}`;
}

export function formatSchemaErrors(errors: FastifySchemaValidationError[], dataVar: SchemaErrorDataVar): Error {
  return new Error(describeSchemaError(errors[0], dataVar));
}

function standardVariant(jokers = 0, exclude?: string): { cards: string[] } | { error: string } {
  const removed = exclude?.split(',').map((card) => card.trim().toUpperCase()) ?? [];
  if (removed.includes('')) {
    return { error: 'exclude cannot contain empty cards' };
  }
  const unknown = removed.find((card) => !STANDARD_CARDS.has(card));
  if (unknown !== undefined) {
    return { error: `exclude contains "${unknown}", which is not a standard card` };
  }
  const cards = [...standardDeck().filter((card) => !removed.includes(card)), ...Array<string>(jokers).fill(JOKER)];
  if (cards.length === 0) {
    return { error: 'exclude cannot remove every card' };
  }
  return { cards };
}

export function toShuffleParams(
  { numDecks, players, handSize, jokers, exclude }: Query,
  deck: unknown,
): ParseResult {
  if ((players === undefined) !== (handSize === undefined)) {
    return { error: 'players and handSize must be given together' };
  }
  if (deck !== undefined && !isCardList(deck)) {
    return { error: 'deck must be a non-empty array of strings' };
  }
  const variant = jokers !== undefined || exclude !== undefined;
  if (variant && deck !== undefined) {
    return { error: 'jokers and exclude only apply to the standard deck' };
  }

  const customDeck = deck?.map((card) => card.trim());
  if (customDeck?.includes('')) {
    return { error: 'deck cannot contain empty cards' };
  }
  let standard: string[] | undefined;
  if (variant) {
    const result = standardVariant(jokers, exclude);
    if ('error' in result) {
      return result;
    }
    standard = result.cards;
  }
  const cardCount = ((customDeck ?? standard)?.length ?? STANDARD_DECK_SIZE) * (numDecks ?? 1);
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
  const cards = customDeck ?? standard;
  if (cards) {
    params.deck = cards;
  }
  return { params };
}
