//amount of decks to hold on server, helps get random
var serverDeckNum = 10;
var decks = new Array();

//52 card normal deck
var suits = ["H","S","C","D"];
var value = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

//the Fisher–Yates shuffle
var fyshuffle = function(deck){
    var cards = deck.split(',');
    for(var i = cards.length-1; i>=1;i--){
        var temp = cards[i];
        var rand = Math.floor(Math.random()*i);
        cards[i] = cards[rand];
        cards[rand] = temp;
    }
    return cards.join();
}

//fill in server decks and shuffle
for(var i = 0;i<serverDeckNum;i++){
    decks[i] = "";
    for(var j = 0;j<suits.length;j++){
        for(var k = 0;k<value.length;k++){
            decks[i] += value[k]+suits[j]+",";
        }
    } 
    decks[i] = decks[i].slice(0,decks[i].length-1);  
    decks[i] = fyshuffle(decks[i]);
}

//get shuffle for stndard card deck
exports.shuffle = function(req, res){
    var query = req.query;
    var params = validate(query, "");
    if(params.error){
        return res.status(401).json({"error": params.error});
    }
    res.status(200).json(shuffleDeck(params));
}

//post shuffle for custom deck if data found
exports.customDeck = function(req, res){
    var query = req.query;
    var params = validate(query, req.body?.deck);
    if(params.error){
        return res.status(401).json({"error": params.error});
    }	
    res.status(200).json(shuffleDeck(params));
}

//shuffles deck and builds json data to return
var shuffleDeck = function(params){
    var deck;
    var pos; //used to replace server decks
    if(params.deck !== undefined){
        deck = params.deck;
        if(params.numDecks !== undefined){
            for(var i = 1;i<params.numDecks;i++){
                deck += ","+params.deck;
            }
        }
    }else{
        pos = Math.floor(Math.random()*serverDeckNum);
        deck = decks[pos];
        if(params.numDecks !== undefined){
            for(var i = 1;i<params.numDecks;i++){
                deck += ","+decks[Math.floor(Math.random()*serverDeckNum)];
            }
        }
    }

    deck = fyshuffle(deck);
    
    //change server deck if only one deck was used
    if(params.deck === undefined && params.numDecks === undefined){
        decks[pos] = deck;
    }
    
    return makeJSONdata(params, deck);
}

//validate data passed in
var validate = function(data, deck){
    var params = new Object();
    if(data['numDecks'] !== undefined && (data['numDecks'] === "" || isNaN(data['numDecks']))){
        params.error = "invalid format for number of decks";
        return params;
    }else if(data['numDecks'] !== undefined){
        params.numDecks = data['numDecks'];
    }

    if(data['players'] !== undefined && (data['players'] === "" || isNaN(data['players']))){
        params.error = "invalid format for number of players";
        return params;
    }else if(data['handSize'] === undefined && data['players'] !== undefined){
        params.error = "in order to use number of players, you need to pass the hand size also";
        return params;
    }else if(data['players'] !== undefined){
        params.players = data['players'];
    }

    if(data['handSize'] !== undefined && (data['handSize'] === "" || isNaN(data['handSize']))){
        params.error = "invalid format for hand size";
        return params;
    }else if(data['players'] === undefined && data['handSize'] !== undefined){
        params.error = "in order to use hand size, you need to pass amount of players also";
        return params;
    }else if(data['handSize'] !== undefined){
        params.hand = data['handSize'];
    }

    if(deck !== undefined && deck !== ""){
        params.deck = deck;
    }

    return params;
}
    
//creates hands for players and the json data to return
var makeJSONdata = function(params, deck){
    var json;
    if(params.players !== undefined){
        var cards = deck.split(',');
        var players = new Array();
        if(params.players * params.hand > cards.length){
            json = {"error": "the amount of cards dealt out is greater than the deck"};
            return json;
        }
           
        for(var i = 0;i<params.players;i++){
            players[i] = "";
        }

        cards.reverse();
        for(var j = 0; j<params.hand;j++){  
            for(var i = 0;i<params.players;i++){
                players[i] += cards.pop() + ",";
                if(j + 1 === params.hand){
                    players[i] = players[i].slice(0,players[i].length-1);  
                }
            }
        }
        cards.reverse();
        deck = cards.join();
        json = {"hands": [], "deck": deck};
        for(var i = 0;i<params.players;i++){
            json.hands.push(players[i]);
        }
    }else{
        json = {"deck": deck};
    }
    return json;
}
