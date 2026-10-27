import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { buildApp } from '../src/app.ts';

interface DeckBody {
  hands: string[][];
  deck: string[];
}

describe('HTTP API', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
  });

  after(async () => {
    await app.close();
  });

  const cardsOf = (body: string) => (JSON.parse(body) as DeckBody).deck;

  test('GET /shuffle returns a shuffled standard deck', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle' });
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] ?? '', /application\/json/);
    assert.equal(new Set(cardsOf(res.body)).size, 52);
  });

  test('GET /shuffle always returns the same shape, with no hands unless dealing', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle' });
    const body = res.json<DeckBody>();
    assert.deepEqual(Object.keys(body), ['hands', 'deck']);
    assert.deepEqual(body.hands, []);
    assert.ok(body.deck.every((card) => typeof card === 'string'));
  });

  test('GET /shuffle?numDecks=2 combines two decks', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle?numDecks=2' });
    assert.equal(res.statusCode, 200);
    assert.equal(cardsOf(res.body).length, 104);
  });

  test('GET /shuffle deals hands', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle?players=4&handSize=5' });
    assert.equal(res.statusCode, 200);
    const body = res.json<DeckBody>();
    assert.equal(body.hands.length, 4);
    assert.ok(body.hands.every((hand) => hand.length === 5));
    assert.equal(body.deck.length, 32);
    assert.equal(new Set([...body.hands.flat(), ...body.deck]).size, 52);
  });

  test('POST /customDeck shuffles a JSON deck', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customDeck?numDecks=3',
      payload: { deck: ['one', 'two', 'three', 'four'] },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(cardsOf(res.body).sort(), [
      ...['four', 'four', 'four', 'one', 'one', 'one'],
      ...['three', 'three', 'three', 'two', 'two', 'two'],
    ]);
  });

  test('POST /customDeck keeps commas inside cards', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customDeck?players=1&handSize=1',
      payload: { deck: ['Ace, high'] },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { hands: [['Ace, high']], deck: [] });
  });

  test('POST /customDeck without a body falls back to a standard deck', async () => {
    const res = await app.inject({ method: 'POST', url: '/customDeck' });
    assert.equal(res.statusCode, 200);
    assert.equal(cardsOf(res.body).length, 52);
  });

  test('POST /customDeck trims whitespace around cards', async () => {
    const res = await app.inject({ method: 'POST', url: '/customDeck', payload: { deck: [' a ', ' b '] } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(cardsOf(res.body).sort(), ['a', 'b']);
  });

  test('GET /health reports ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { status: 'ok' });
  });

  test('POST /customDeck accepts the maximum numDecks with a small deck', async () => {
    const res = await app.inject({ method: 'POST', url: '/customDeck?numDecks=100', payload: { deck: ['a', 'b'] } });
    assert.equal(res.statusCode, 200);
    assert.equal(cardsOf(res.body).length, 200);
  });

  const json = { 'content-type': 'application/json' };
  const errorCases: [string, InjectOptions, number, string][] = [
    ['non-numeric numDecks', { url: '/shuffle?numDecks=abc' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['empty numDecks', { url: '/shuffle?numDecks=' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['zero numDecks', { url: '/shuffle?numDecks=0' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['fractional numDecks', { url: '/shuffle?numDecks=1.5' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['exponent numDecks', { url: '/shuffle?numDecks=1e1' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['hex numDecks', { url: '/shuffle?numDecks=0x10' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['space-padded numDecks', { url: '/shuffle?numDecks=%205' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['zero-padded numDecks', { url: '/shuffle?numDecks=007' }, 400, 'numDecks must be a whole number from 1 to 100'],
    ['more than 100 decks', { url: '/shuffle?numDecks=101' }, 400, 'numDecks must be a whole number from 1 to 100'],
    [
      'repeated numDecks',
      { url: '/shuffle?numDecks=1&numDecks=2' },
      400,
      'numDecks must be a whole number from 1 to 100',
    ],
    ['non-numeric players', { url: '/shuffle?players=x&handSize=5' }, 400, 'players must be a positive whole number'],
    ['negative handSize', { url: '/shuffle?players=4&handSize=-1' }, 400, 'handSize must be a positive whole number'],
    ['decimal-point players', { url: '/shuffle?players=2.0&handSize=3' }, 400, 'players must be a positive whole number'],
    ['an unknown query parameter', { url: '/shuffle?decks=2' }, 400, 'unknown query parameter "decks"'],
    ['players without handSize', { url: '/shuffle?players=4' }, 400, 'players and handSize must be given together'],
    ['handSize without players', { url: '/shuffle?handSize=5' }, 400, 'players and handSize must be given together'],
    [
      'dealing more cards than the deck',
      { url: '/shuffle?players=20&handSize=5' },
      400,
      'cannot deal 100 cards (20 players × 5) from a deck of 52',
    ],
    [
      'an invalid query on /customDeck',
      { method: 'POST', url: '/customDeck?numDecks=0', payload: { deck: ['a'] } },
      400,
      'numDecks must be a whole number from 1 to 100',
    ],
    ['a comma-separated string deck', { method: 'POST', url: '/customDeck', payload: { deck: 'a,b' } }, 400, 'deck must be a non-empty array of strings'],
    ['a numeric deck', { method: 'POST', url: '/customDeck', payload: { deck: 5 } }, 400, 'deck must be a non-empty array of strings'],
    ['a null deck', { method: 'POST', url: '/customDeck', payload: { deck: null } }, 400, 'deck must be a non-empty array of strings'],
    ['an empty deck', { method: 'POST', url: '/customDeck', payload: { deck: [] } }, 400, 'deck must be a non-empty array of strings'],
    ['non-string cards', { method: 'POST', url: '/customDeck', payload: { deck: ['a', 2] } }, 400, 'deck must be a non-empty array of strings'],
    ['nested cards', { method: 'POST', url: '/customDeck', payload: { deck: [['a']] } }, 400, 'deck must be a non-empty array of strings'],
    [
      'an unknown body field',
      { method: 'POST', url: '/customDeck', payload: { deck: ['a'], cards: 'b' } },
      400,
      'unknown field "cards" in request body',
    ],
    [
      'a JSON body that is not an object',
      { method: 'POST', url: '/customDeck', headers: json, payload: '["a","b"]' },
      400,
      'request body must be an object',
    ],
    [
      'empty cards',
      { method: 'POST', url: '/customDeck', payload: { deck: ['a', ' ', 'b'] } },
      400,
      'deck cannot contain empty cards',
    ],
    [
      'decks over the card limit',
      {
        method: 'POST',
        url: '/customDeck?numDecks=100',
        payload: { deck: Array.from({ length: 101 }, (_, i) => String(i)) },
      },
      400,
      'deck cannot have more than 10000 cards in total, but 101 cards × 100 decks is 10100',
    ],
    [
      'malformed JSON',
      { method: 'POST', url: '/customDeck', headers: json, payload: '{"deck":' },
      400,
      'request body is not valid JSON',
    ],
    [
      'an empty JSON body',
      { method: 'POST', url: '/customDeck', headers: json, payload: '' },
      400,
      'request body cannot be empty when the content type is application/json',
    ],
    [
      'a plain-text body',
      { method: 'POST', url: '/customDeck', headers: { 'content-type': 'text/plain' }, payload: 'a,b' },
      415,
      'unsupported content type "text/plain", use application/json',
    ],
    [
      'a form-encoded body',
      {
        method: 'POST',
        url: '/customDeck',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        payload: 'deck=a',
      },
      415,
      'unsupported content type "application/x-www-form-urlencoded", use application/json',
    ],
    ['an unknown route', { url: '/nope?numDecks=2' }, 404, 'route GET /nope not found'],
    ['an unsupported method', { method: 'DELETE', url: '/shuffle' }, 404, 'route DELETE /shuffle not found'],
  ];

  for (const [name, request, statusCode, error] of errorCases) {
    test(`rejects ${name} with ${String(statusCode)}`, async () => {
      const res = await app.inject(request);
      assert.equal(res.statusCode, statusCode);
      assert.match(res.headers['content-type'] ?? '', /application\/json/);
      assert.deepEqual(res.json(), { error });
    });
  }
});

describe('HTTP API internal errors', () => {
  test('returns a generic 500 without leaking the error message', async () => {
    const app = await buildApp();
    app.get('/boom', () => {
      throw new Error('database password is hunter2');
    });
    const res = await app.inject({ method: 'GET', url: '/boom' });
    await app.close();
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.json(), { error: 'internal server error' });
  });
});

describe('rate limiting', () => {
  test('returns 429 once the limit is exceeded', async () => {
    const app = await buildApp({ rateLimit: { max: 2, timeWindow: '1 minute' } });
    try {
      for (let i = 0; i < 2; i++) {
        const res = await app.inject({ method: 'GET', url: '/shuffle' });
        assert.equal(res.statusCode, 200);
      }
      const res = await app.inject({ method: 'GET', url: '/shuffle' });
      assert.equal(res.statusCode, 429);
      assert.ok(res.headers['retry-after']);
      assert.deepEqual(Object.keys(res.json<object>()), ['error']);
    } finally {
      await app.close();
    }
  });

  test('does not limit /health', async () => {
    const app = await buildApp({ rateLimit: { max: 1, timeWindow: '1 minute' } });
    try {
      for (let i = 0; i < 3; i++) {
        const res = await app.inject({ method: 'GET', url: '/health' });
        assert.equal(res.statusCode, 200);
      }
    } finally {
      await app.close();
    }
  });
});

describe('CORS', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
  });

  after(async () => {
    await app.close();
  });

  test('allows any origin on simple requests', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/shuffle',
      headers: { origin: 'https://example.com' },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-allow-origin'], '*');
  });

  test('answers preflight requests with the allowed methods', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/customDeck',
      headers: {
        origin: 'https://example.com',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });
    assert.equal(res.statusCode, 204);
    assert.equal(res.headers['access-control-allow-origin'], '*');
    assert.equal(res.headers['access-control-allow-methods'], 'GET, POST');
  });
});
