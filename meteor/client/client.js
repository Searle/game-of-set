
var gameId;
var cardSet= [];
var round;

var buildCards= function() {
    var game= Game.load();

    if ( !game || !("visibleCards" in game) ) {
        cardSet= [];
        return cardSet;
    }

    if ( game.round === round && game._id === gameId && cardSet.length ) return cardSet;

    visibleCards= game.visibleCards;

    cardSet= visibleCards.map(function(row, r) {
        return {
            cols: row.map(function(num, c) {
                return {
                    card: new Card(num, r, c),
                };
            }),
        };
    });

    round= game.round;
    gameId= game._id;

    return cardSet;
}

var selectedCards= [];
Session.set('selectedCards', selectedCards)

Template.cardSet.row= function() {
    return buildCards();
}

Template.cardSet.events({
    'click .shuffleCards': function() {
        cardSet= [];
        Game.init();
    },
});

Template.cardRow.col= function( row ) {
    return this.cols;
}

Template.card.class= function() {
    var card= this.card;
    return (Session.get('selectedCards') || []).filter(function( c ) {
        return c.num === card.num;
    }).length ? "selected" : "";
}

Template.card.cardElem= function() {
    var elems= [];
    var card= this.card;
    var cardElem= { cssX: card.cssX, cssY: card.cssY };
    for ( var i= 0; i < card.count; i++ ) {
        elems.push(cardElem);
    }
    return elems;
}

Template.card.events({
    'click .card': function() {
        var card= this.card;
        if ( typeof card.num !== 'number' ) return;

        var oldSelectedLength= selectedCards.length;
        selectedCards= selectedCards.filter(function( c ) {
            return c.num !== card.num;
        });
        if ( oldSelectedLength != selectedCards.length ) {
            Session.set('selectedCards', selectedCards)
            return;
        }

        selectedCards.push(this.card);
        Session.set('selectedCards', selectedCards)

        if ( selectedCards.length < 3 ) return;

        if ( Card.matches(selectedCards[0], selectedCards[1], selectedCards[2]) ) {
            console.log("MATCH")
            var game= Game.load();

            selectedCards.forEach(function(card) {
                var face= game.cardStack.shift();
                card.setFace(face);
                game.visibleCards[card.row][card.col]= face;
            });
            game.round++;
            Games.update(game._id, { $set: { visibleCards: game.visibleCards, cardStack: game.cardStack, round: game.round, } });
        }

        selectedCards= [];
        Session.set('selectedCards', selectedCards)
    }
});
