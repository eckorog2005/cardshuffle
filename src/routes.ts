import type { FastifyPluginCallback, FastifyReply } from 'fastify';
import type { Random } from './deck.ts';
import { seededRandom } from './random.ts';
import { bodySchema, formatSchemaErrors, querySchema, toShuffleParams, type Body, type Query } from './params.ts';
import { shuffleRequest } from './shuffle.ts';

export interface ShuffleRoutesOptions {
  random: Random;
}

const cards = { type: 'array', items: { type: 'string' } } as const;

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' } },
  required: ['error'],
} as const;

const responses = {
  200: {
    description: 'The shuffled deck, and the hands when players and handSize are given.',
    type: 'object',
    properties: {
      hands: { type: 'array', items: cards, description: 'One array of cards per player, dealt round-robin.' },
      deck: { ...cards, description: 'The shuffled cards left after dealing.' },
    },
    required: ['hands', 'deck'],
  },
  '4xx': { description: 'Invalid request.', ...errorResponse },
} as const;

export const shuffleRoutes: FastifyPluginCallback<ShuffleRoutesOptions> = (app, { random }, done) => {
  const respond = (reply: FastifyReply, query: Query, deck: unknown) => {
    const result = toShuffleParams(query, deck);
    if ('error' in result) {
      return reply.code(400).send({ error: result.error });
    }
    const source = query.seed === undefined ? random : seededRandom(query.seed);
    return reply.code(200).send(shuffleRequest(result.params, source));
  };

  app.get<{ Querystring: Query }>(
    '/shuffle',
    {
      schema: { summary: 'Shuffle a standard deck', querystring: querySchema, response: responses },
      schemaErrorFormatter: formatSchemaErrors,
    },
    (request, reply) => respond(reply, request.query, undefined),
  );
  app.post<{ Querystring: Query; Body: Body | null }>(
    '/customDeck',
    {
      schema: {
        summary: 'Shuffle a custom deck',
        description: 'Without a body, or without a deck field, a standard deck is shuffled.',
        querystring: querySchema,
        body: bodySchema,
        response: responses,
      },
      schemaErrorFormatter: formatSchemaErrors,
    },
    (request, reply) => respond(reply, request.query, request.body?.deck),
  );
  done();
};
