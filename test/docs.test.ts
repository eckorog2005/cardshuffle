import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';

interface Parameter {
  name: string;
  in: string;
  description?: string;
  schema: Record<string, unknown>;
}

interface Spec {
  openapi: string;
  paths: Record<string, Record<string, { parameters?: Parameter[]; requestBody?: Record<string, unknown> }>>;
}

describe('API docs', () => {
  let app: FastifyInstance;
  let spec: Spec;

  before(async () => {
    app = await buildApp();
    spec = (await app.inject({ url: '/docs/json' })).json<Spec>();
  });

  after(async () => {
    await app.close();
  });

  const parameter = (name: string) => {
    const found = spec.paths['/shuffle'].get.parameters?.find((param) => param.name === name);
    assert.ok(found, `missing parameter ${name}`);
    return found;
  };

  test('documents every API route and none of the docs routes', () => {
    assert.match(spec.openapi, /^3\./);
    assert.deepEqual(Object.keys(spec.paths).sort(), ['/customDeck', '/health', '/shuffle']);
  });

  test('documents every query option with a description', () => {
    const names = spec.paths['/shuffle'].get.parameters?.map((param) => param.name).sort();
    assert.deepEqual(names, ['exclude', 'handSize', 'jokers', 'numDecks', 'players', 'seed']);
    assert.ok(spec.paths['/shuffle'].get.parameters?.every((param) => param.in === 'query' && param.description));
  });

  test('shows integer options as plain integers', () => {
    assert.deepEqual(parameter('numDecks').schema, { type: 'integer', minimum: 1, maximum: 100 });
    assert.deepEqual(parameter('jokers').schema, { type: 'integer', minimum: 1, maximum: 2 });
  });

  test('documents the custom deck body as an optional array of strings', () => {
    const body = spec.paths['/customDeck'].post.requestBody as {
      required: boolean;
      content: { 'application/json': { schema: { properties: { deck: Record<string, unknown> } } } };
    };
    assert.equal(body.required, false);
    const { type, items } = body.content['application/json'].schema.properties.deck;
    assert.deepEqual({ type, items }, { type: 'array', items: { type: 'string', minLength: 1 } });
  });

  test('serves the interactive docs page', async () => {
    const res = await app.inject({ url: '/docs' });
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] ?? '', /text\/html/);
  });
});
