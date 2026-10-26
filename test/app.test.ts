import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';

interface DeckBody {
  deck: string;
  hands?: string[];
  error?: string;
}

describe('HTTP API', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
  });

  after(async () => {
    await app.close();
  });

  const cardsOf = (body: string) => (JSON.parse(body) as DeckBody).deck.split(',');

  test('GET /shuffle returns a shuffled standard deck', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle' });
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'] ?? '', /application\/json/);
    assert.equal(new Set(cardsOf(res.body)).size, 52);
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
    assert.ok(body.hands);
    assert.equal(body.hands.length, 4);
    assert.ok(body.hands.every((hand) => hand.split(',').length === 5));
    assert.equal(body.deck.split(',').length, 32);
  });

  test('GET /shuffle rejects invalid options with 400', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle?players=4' });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), {
      error: 'in order to use number of players, you need to pass the hand size also',
    });
  });

  test('GET /shuffle reports when hands need more cards than the deck', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle?players=20&handSize=5' });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { error: 'the amount of cards dealt out is greater than the deck' });
  });

  test('POST /customDeck shuffles a JSON deck', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customDeck?numDecks=3',
      payload: { deck: 'one,two,three,four' },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(cardsOf(res.body).sort(), [
      ...['four', 'four', 'four', 'one', 'one', 'one'],
      ...['three', 'three', 'three', 'two', 'two', 'two'],
    ]);
  });

  test('POST /customDeck accepts a form-encoded deck', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customDeck',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'deck=a,b,c',
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(cardsOf(res.body).sort(), ['a', 'b', 'c']);
  });

  test('POST /customDeck without a body falls back to a standard deck', async () => {
    const res = await app.inject({ method: 'POST', url: '/customDeck' });
    assert.equal(res.statusCode, 200);
    assert.equal(cardsOf(res.body).length, 52);
  });

  test('POST /customDeck rejects a non-string deck', async () => {
    const res = await app.inject({ method: 'POST', url: '/customDeck', payload: { deck: ['a', 'b'] } });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), { error: 'invalid format for deck' });
  });

  test('GET /shuffle rejects more than 100 decks', async () => {
    const res = await app.inject({ method: 'GET', url: '/shuffle?numDecks=101' });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), { error: 'number of decks cannot be more than 100' });
  });

  test('POST /customDeck rejects decks over the card limit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/customDeck?numDecks=100',
      payload: { deck: Array.from({ length: 101 }, (_, i) => String(i)).join() },
    });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.json(), { error: 'custom deck cannot have more than 10000 cards in total' });
  });

  test('unknown routes return 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    assert.equal(res.statusCode, 404);
  });
});
