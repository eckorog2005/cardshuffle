import Fastify, { type FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody';
import { randomInt } from 'node:crypto';
import type { Random } from './deck.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
}

export async function buildApp({ random = randomInt }: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify();
  await app.register(formbody);
  await app.register(shuffleRoutes, { random });
  return app;
}
