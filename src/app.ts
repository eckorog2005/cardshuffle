import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { randomInt } from 'node:crypto';
import type { Random } from './deck.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
  rateLimit?: { max?: number; timeWindow?: number | string };
}

export async function buildApp({ random = randomInt, rateLimit: limits = {} }: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify();
  // Without this, a text/plain deck is parsed but ignored and the caller silently gets a standard deck.
  app.removeContentTypeParser('text/plain');
  await app.register(cors, { origin: '*', methods: ['GET', 'POST'] });
  await app.register(rateLimit, {
    max: limits.max ?? 100,
    timeWindow: limits.timeWindow ?? '1 minute',
  });
  await app.register(formbody);
  await app.register(shuffleRoutes, { random });
  return app;
}
