*Simple REST API to get a deck of shuffled cards along with hands for players.*

Use cardshuffle.net to use the api.

## Development

Requires Node 26 (`nvm use` picks it up from `.nvmrc`).

```bash
npm install
npm run dev        # run from source with auto-reload
npm run build      # compile to dist/
npm start          # run the compiled server
npm run lint
npm run typecheck
npm test
```

The server listens on `PORT` (default 4000) and `IP` (default all interfaces). It logs JSON lines (Fastify's pino logger) to stdout, and shuts down gracefully on `SIGTERM`/`SIGINT`.

Requests are rate limited per client IP to `RATE_LIMIT_MAX` requests (default 100) per `RATE_LIMIT_WINDOW` (default `1 minute`; milliseconds or a string like `30 seconds`). Over the limit the API returns 429 with a `Retry-After` header.

CORS is enabled for any origin, for `GET` and `POST`.

## API

There are two endpoints:

- `GET /shuffle` returns a shuffled standard deck. Cards are written as value then suit, e.g. `10H` is the 10 of hearts.
- `POST /customDeck` shuffles a deck you send as a JSON body: `{"deck":["one","two","three"]}`. Each card must be a string; whitespace around each card is trimmed, and empty cards are rejected. Cards may contain any other characters, commas included. Other content types return 415. With no body, or no `deck` field, it falls back to a standard deck; an empty `deck` array is rejected.

`GET /health` returns `{"status":"ok"}` for liveness checks. It is not rate limited.

Interactive API docs are served at `/docs`, and the OpenAPI 3 spec, generated from the route schemas, at `/docs/json`.

Both shuffle endpoints accept these query options:

| Option       | Meaning                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `numDecks`   | Number of decks to shuffle together (1-100). A custom deck can hold at most 10000 cards in total.  |
| `players`\*  | Number of hands to deal from the deck.                                                             |
| `handSize`\* | Number of cards in each hand.                                                                      |
| `seed`       | Any string of 1-128 characters. The same seed and options always give the same shuffle and deal.   |
| `jokers`     | Add 1 or 2 jokers (`JK`) to each standard deck.                                                    |
| `exclude`    | Comma-separated standard cards to remove from each deck, e.g. `2H,2S,2C,2D`. Case-insensitive.     |

\* `players` and `handSize` must be used together, and can't deal more cards than the deck holds.

`jokers` and `exclude` only work with the standard deck, not with a custom `deck`.

Without a `seed`, every request is shuffled with a cryptographically secure random source. A seed makes the result predictable to anyone who knows it, so use one for replays and tests, not where players must not be able to work out the deck.

Unknown query parameters and body fields are rejected.

## Errors

Every error response has a JSON body of the form `{"error": "<message>"}`:

| Status | When                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------- |
| 400    | Invalid or unknown query options or body fields, malformed JSON, or a deal larger than the deck.        |
| 404    | Unknown route or method.                                                                                |
| 415    | A `/customDeck` body that isn't JSON.                                                                   |
| 429    | Rate limit exceeded; see the `Retry-After` header.                                                      |
| 500    | Unexpected server error (details are logged, not returned).                                            |

### Response

Every successful response has the same shape:

```json
{
  "hands": [["10D", "JS"], ["8C", "8H"]],
  "deck": ["KH", "KS", "JC"]
}
```

- `hands` holds one array of cards per player, dealt round-robin. It is `[]` when `players`/`handSize` aren't given.
- `deck` holds the shuffled cards left after dealing (all of them when nothing is dealt).

## Examples

```console
$ curl 'http://localhost:4000/shuffle'
{"hands":[],"deck":["7D","8H","4D","KH","9D","QS","4S","6D","6C","2D","10H","2H","4C","AH","KS","5C","5H","10S","10C","JD","10D","JS","6H","7S","3C","8C","QD","3D","7H","4H","AC","JH","JC","QC","7C","KC","3H","8D","3S","2C","AD","QH","6S","8S","KD","2S","9S","9C","AS","5D","9H","5S"]}
```

```console
$ curl 'http://localhost:4000/shuffle?players=4&handSize=5'
{
  "hands": [
    ["10D", "JS", "4D", "JH", "5C"],
    ["8C", "8H", "9D", "AD", "4C"],
    ["KC", "3S", "QC", "6H", "4S"],
    ["5D", "4H", "AS", "2S", "AH"]
  ],
  "deck": ["KH", "KS", "JC", "7C", "3H", "3C", "5S", "7D", "2H", "9H", "2C", "10C", "7S", "8S", "6C", "10S", "8D", "7H", "2D", "AC", "QS", "JD", "6S", "3D", "KD", "QD", "9S", "QH", "6D", "5H", "9C", "10H"]
}
```

```console
$ curl 'http://localhost:4000/shuffle?seed=demo&players=2&handSize=3'
{"hands":[["2C","JH","KC"],["9C","QH","6H"]],"deck":["4C","8H","10H","4D","8S","6C","6S","7S","3S","5H","4H","10C","7H","KS","AS","7D","10S","KH","3D","AD","10D","QD","9S","8D","QC","5S","6D","JD","8C","5D","2D","9H","4S","2H","KD","AC","9D","JS","AH","5C","3H","7C","3C","QS","JC","2S"]}
```

```console
$ curl 'http://localhost:4000/shuffle?seed=demo&jokers=2&exclude=2H,2S,2C,2D&players=2&handSize=3'
{"hands":[["8D","9C","3S"],["JS","10D","3C"]],"deck":["AH","6H","JH","5S","5C","JK","7C","QC","3D","4H","9H","10C","10S","JK","8S","6D","KH","7H","5H","7D","5D","4D","8C","KS","9D","6C","JC","7S","9S","AD","QH","3H","4S","AC","8H","KC","JD","4C","KD","6S","AS","QD","QS","10H"]}
```

```console
$ curl 'http://localhost:4000/shuffle?players=4'
{"error":"players and handSize must be given together"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":["one","two","three","four"]}' 'http://localhost:4000/customDeck'
{"hands":[],"deck":["four","one","two","three"]}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":["Ace, high","two","three"]}' 'http://localhost:4000/customDeck?numDecks=2'
{"hands":[],"deck":["Ace, high","two","three","three","two","Ace, high"]}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":["one","","two"]}' 'http://localhost:4000/customDeck'
{"error":"deck cannot contain empty cards"}
```

```console
$ curl 'http://localhost:4000/shuffle?numDecks=101'
{"error":"numDecks must be a whole number from 1 to 100"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":"one,two"}' 'http://localhost:4000/customDeck'
{"error":"deck must be a non-empty array of strings"}
```
