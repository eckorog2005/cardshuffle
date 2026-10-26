import Fastify, { type FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody';
import { randomInt } from 'node:crypto';
import type { Random } from './deck.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
  logger?: boolean;
}

export async function buildApp({ random = randomInt, logger = false }: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger });
  // Without this, a text/plain deck is parsed but ignored and the caller silently gets a standard deck.
  app.removeContentTypeParser('text/plain');
  await app.register(formbody);
  app.get('/health', () => ({ status: 'ok' }));
  await app.register(shuffleRoutes, { random });
  return app;
}
