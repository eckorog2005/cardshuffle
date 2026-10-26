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

The server listens on `PORT` (default 4000) and `IP` (default all interfaces).

Requests are rate limited per client IP to `RATE_LIMIT_MAX` requests (default 100) per `RATE_LIMIT_WINDOW` (default `1 minute`; milliseconds or a string like `30 seconds`). Over the limit the API returns 429 with a `Retry-After` header.

CORS is enabled for any origin, for `GET` and `POST`.

## API

There are two endpoints:

- `GET /shuffle` returns a shuffled standard deck. Cards are written as value then suit, e.g. `10H` is the 10 of hearts.
- `POST /customDeck` shuffles a deck you send in the body as JSON (`{"deck":"one,two,three"}`) or form data (`deck=one,two,three`). Cards are comma-separated, whitespace around each card is trimmed, and empty cards are rejected. Other content types return 415. With no body it falls back to a standard deck.

Both accept these query options:

| Option      | Meaning                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------- |
| `numDecks`  | Number of decks to shuffle together (1-100). A custom deck can hold at most 10000 cards in total. |
| `players`\* | Number of hands to deal from the deck.                                                        |
| `handSize`\* | Number of cards in each hand.                                                                |

\* `players` and `handSize` must be used together, and can't deal more cards than the deck holds. Invalid options return 400 with an `error` message.

## Examples

```console
$ curl 'http://localhost:4000/shuffle'
{"deck":"JH,8H,3H,KD,8D,QH,7D,7C,9S,5C,9H,2S,10D,AH,9D,2H,QD,JS,KC,6S,4S,7H,5D,3S,6D,JC,AC,6C,KS,10S,5S,8C,KH,3D,3C,AS,4D,10H,9C,4H,8S,AD,2D,QC,JD,7S,4C,10C,6H,2C,5H,QS"}
```

```console
$ curl 'http://localhost:4000/shuffle?numDecks=2'
{"deck":"QD,QS,6D,4C,9D,QS,4S,KS,4H,9S,2H,8D,AC,KC,10D,JH,3H,7S,QH,KH,6S,10H,10C,JH,8S,8S,AD,3D,AH,5S,7C,8H,3S,5C,9C,7C,3C,2D,KD,7D,5H,8H,AS,9H,7D,6H,6C,9C,2C,2D,5S,6S,3H,KH,9D,4S,KD,AD,8C,7H,10S,2H,4C,JC,QC,JC,8D,AS,4H,5C,4D,KC,3S,KS,5H,2S,JS,7S,6H,10C,JD,4D,10H,JS,2S,AH,10S,9S,QH,7H,2C,3D,QC,10D,8C,5D,9H,5D,6D,3C,JD,QD,AC,6C"}
```

```console
$ curl 'http://localhost:4000/shuffle?players=4&handSize=5'
{
  "hands": [
    "QH,6D,5C,7C,8H",
    "10S,5H,6H,KS,3S",
    "10D,KC,8S,6S,AS",
    "3H,3D,9S,QD,AC"
  ],
  "deck": "10H,QS,7S,4D,2D,9D,4S,4H,8D,2S,8C,7D,JS,6C,7H,AH,2C,9H,9C,QC,2H,4C,5D,KH,JD,10C,3C,5S,AD,JH,JC,KD"
}
```

```console
$ curl 'http://localhost:4000/shuffle?players=4'
{"error":"in order to use number of players, you need to pass the hand size also"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":"one,two,three,four"}' 'http://localhost:4000/customDeck'
{"deck":"two,four,one,three"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":"one,two,three,four"}' 'http://localhost:4000/customDeck?numDecks=3'
{"deck":"two,three,two,two,one,four,four,four,three,one,three,one"}
```

```console
$ curl -X POST -H 'Content-Type: application/json' -d '{"deck":"one,,two"}' 'http://localhost:4000/customDeck'
{"error":"custom deck cannot contain empty cards"}
```
