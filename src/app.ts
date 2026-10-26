import Fastify, { type FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';
import type { Random } from './deck.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
}

export async function buildApp({ random = randomInt }: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify();
  // Without this, a text/plain deck is parsed but ignored and the caller silently gets a standard deck.
  app.removeContentTypeParser('text/plain');
  await app.register(shuffleRoutes, { random });
  return app;
}
