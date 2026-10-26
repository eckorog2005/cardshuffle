import Fastify, { type FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody';
import { DeckPool, type Random } from './deck.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
}

export async function buildApp({ random = Math.random }: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify();
  await app.register(formbody);
  await app.register(shuffleRoutes, { pool: new DeckPool(random), random });
  return app;
}
