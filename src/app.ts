import Fastify, { type FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody';
import { randomInt } from 'node:crypto';
import type { Random } from './deck.ts';
import { errorHandler, notFoundHandler } from './errors.ts';
import { shuffleRoutes } from './routes.ts';

export interface AppOptions {
  random?: Random;
}

export async function buildApp({ random = randomInt }: AppOptions = {}): Promise<FastifyInstance> {
  // Fastify's default silently strips unknown properties; reject them instead.
  const app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  // Without this, a text/plain deck is parsed but ignored and the caller silently gets a standard deck.
  app.removeContentTypeParser('text/plain');
  await app.register(formbody);
  await app.register(shuffleRoutes, { random });
  return app;
}
