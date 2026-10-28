import type { FastifyPluginCallback, FastifyReply } from 'fastify';
import type { Random } from './deck.ts';
import { seededRandom } from './random.ts';
import { bodySchema, formatSchemaErrors, querySchema, toShuffleParams, type Body, type Query } from './params.ts';
import { shuffleRequest } from './shuffle.ts';

export interface ShuffleRoutesOptions {
  random: Random;
}

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
    { schema: { querystring: querySchema }, schemaErrorFormatter: formatSchemaErrors },
    (request, reply) => respond(reply, request.query, undefined),
  );
  app.post<{ Querystring: Query; Body: Body | null }>(
    '/customDeck',
    { schema: { querystring: querySchema, body: bodySchema }, schemaErrorFormatter: formatSchemaErrors },
    (request, reply) => respond(reply, request.query, request.body?.deck),
  );
  done();
};
