*Simple REST API to get a deck of shuffled cards along with hands for players.*

Use cardshuffle.net to use the api.

## Development

Requires Node 26 (`nvm use` picks it up from `.nvmrc`).

<pre>
npm install
npm run dev        # run from source with auto-reload
npm run build      # compile to dist/
npm start          # run the compiled server
npm run lint
npm run typecheck
npm test
</pre>

The server listens on `PORT` (default 4000) and `IP` (default all interfaces).

## API

two url to use:
</pre>
GET /shuffle : for standard deck of  (format of value then suit. EX: 10H is 10 of hearts).

POST /customDeck :  pass in JSON data for a deck.
</pre>

the following options can be used in the GET query:
<pre>
numDecks: number of decks to shuffle together.

players*: amount of hands(players) to make from the deck.

handSize*: how many cards are in each hand.

*Note that player and handSize needs to be used together or 400 response is send.
</pre>
when adding a custom deck, add the POST JSON data.  for ex:
  
<pre>
  {"deck","one,two,three"}
</pre>
  

Examples:
<pre>
curl -X GET 'http://localhost:4000/shuffle'

{
  "deck": "JH,8H,3H,KD,8D,QH,7D,7C,9S,5C,9H,2S,10D,AH,9D,2H,QD,JS,KC,6S,4S,7H,5D,3S,6D,JC,AC,6C,KS,10S,5S,8C,KH,3D,3C,AS,4D,10H,9C,4H,8S,AD,2D,QC,JD,7S,4C,10C,6H,2C,5H,QS"
}
</pre>

<pre>
curl -X GET 'http://localhost:4000/shuffle?numDecks=2'
{
  "deck": "QD,QS,6D,4C,9D,QS,4S,KS,4H,9S,2H,8D,AC,KC,10D,JH,3H,7S,QH,KH,6S,10H,10C,JH,8S,8S,AD,3D,AH,5S,7C,8H,3S,5C,9C,7C,3C,2D,KD,7D,5H,8H,AS,9H,7D,6H,6C,9C,2C,2D,5S,6S,3H,KH,9D,4S,KD,AD,8C,7H,10S,2H,4C,JC,QC,JC,8D,AS,4H,5C,4D,KC,3S,KS,5H,2S,JS,7S,6H,10C,JD,4D,10H,JS,2S,AH,10S,9S,QH,7H,2C,3D,QC,10D,8C,5D,9H,5D,6D,3C,JD,QD,AC,6C"
}
</pre>

<pre>
curl -X GET 'http://localhost:4000/shuffle?players=4&handSize=5'
{
  "hands": [
    "QH,6D,5C,7C,8H",
    "10S,5H,6H,KS,3S",
    "10D,KC,8S,6S,AS",
    "3H,3D,9S,QD,AC"
  ],
  "deck": "10H,QS,7S,4D,2D,9D,4S,4H,8D,2S,8C,7D,JS,6C,7H,AH,2C,9H,9C,QC,2H,4C,5D,KH,JD,10C,3C,5S,AD,JH,JC,KD"
}
</pre>

<pre>
curl -X GET 'http://localhost:4000/shuffle?players=4'{
  "error": "in order to use number of players, you need to pass the hand size also"
}
</pre>

<pre>
curl  -X POST -H "Content-Type: application/json" -d '{"deck":"one,two,three,four"}' 'http://localhost:4000/customDeck'
{
  "deck": "two,four,one,three"
}
</pre>

<pre>
curl  -X POST -H "Content-Type: application/json" -d '{"deck":"one,two,three,four"}' 'http://localhost:4000/customDeck?numDecks=3'
{
  "deck": "two,three,two,two,one,four,four,four,three,one,three,one"
}
</pre>
