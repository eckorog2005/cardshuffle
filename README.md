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
- `POST /customDeck` shuffles a deck you send as a JSON body: `{"deck":["one","two","three"]}`. Each card must be a string; whitespace around each card is trimmed, and empty cards are rejected. Cards may contain any other characters, commas included. Other content types return 415. With no body, or an empty `deck` array, it falls back to a standard deck.

`GET /health` returns `{"status":"ok"}` for liveness checks. It is not rate limited.

Both shuffle endpoints accept these query options:

| Option       | Meaning                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `numDecks`   | Number of decks to shuffle together (1-100). A custom deck can hold at most 10000 cards in total.  |
| `players`\*  | Number of hands to deal from the deck.                                                             |
| `handSize`\* | Number of cards in each hand.                                                                      |

\* `players` and `handSize` must be used together, and can't deal more cards than the deck holds. Invalid options return 400 with an `error` message.

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
$ curl 'http://localhost:4000/shuffle?players=4'
{"error":"in order to use number of players, you need to pass the hand size also"}
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
{"error":"custom deck cannot contain empty cards"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":"one,two"}' 'http://localhost:4000/customDeck'
{"error":"invalid format for deck"}
```
