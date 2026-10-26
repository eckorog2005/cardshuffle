import type { FastifyPluginCallback, FastifyReply } from 'fastify';
import type { DeckPool, Random } from './deck.ts';
import { parseParams, type Query } from './params.ts';
import { shuffleRequest } from './shuffle.ts';

export interface ShuffleRoutesOptions {
  pool: DeckPool;
  random: Random;
}

const bodyDeck = (body: unknown): unknown =>
  typeof body === 'object' && body !== null && 'deck' in body ? body.deck : undefined;

export const shuffleRoutes: FastifyPluginCallback<ShuffleRoutesOptions> = (app, { pool, random }, done) => {
  const respond = (reply: FastifyReply, query: Query, deck: unknown) => {
    const result = parseParams(query, deck);
    if ('error' in result) {
      return reply.code(400).send({ error: result.error });
    }
    return reply.code(200).send(shuffleRequest(result.params, pool, random));
  };

  app.get<{ Querystring: Query }>('/shuffle', (request, reply) => respond(reply, request.query, undefined));
  app.post<{ Querystring: Query }>('/customDeck', (request, reply) =>
    respond(reply, request.query, bodyDeck(request.body)),
  );
  done();
};
