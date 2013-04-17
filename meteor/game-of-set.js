var CardSets = new Meteor.Collection("cardSets");

var getCardSet= function() {
    return CardSets.findOne();
};

if (Meteor.isClient) {

    var selectedCards= {};
    Session.set('selectedCards', selectedCards)

    var buildCardIndex= function( card ) {
        return card.row + "-" + card.col;
    };

    Template.cardSet.row= function() {
        var cardSet= getCardSet();
        if ( cardSet ) return cardSet.set.map(function( v, i ) { return { row: i, cards: v, }; });
    }

    Template.cardRow.col= function( row ) {
        var cardSet= getCardSet();
        if ( cardSet && cardSet.set && cardSet.set[row] ) {
            var cardRow= cardSet.set[row];
            return cardRow.map(function( v, i ) {
                var key= buildCardIndex(v);
                return { row: row, col: i, card: v, };
            });
        }
    }

    Template.card.selected= function() {
        var key= buildCardIndex(this);
        return key in Session.get('selectedCards');
    }

    Template.card.events({
        'click a': function() {
            var key= buildCardIndex(this);
            if ( key in selectedCards ) {
                delete selectedCards[key];
                Session.set('selectedCards', selectedCards)
                return;
            }

            selectedCards[key]= 1;
            Session.set('selectedCards', selectedCards)

            if ( Object.keys(selectedCards).length < 3 ) return;

            var cardSet= getCardSet();

            for ( var key in selectedCards ) {
                var parts= key.split("-");
                var row= parts[0];
                var col= parts[1];
                cardSet.set[row][col]= -cardSet.set[row][col];
            }
            selectedCards= {};
            Session.set('selectedCards', selectedCards)

            CardSets.update(cardSet._id, cardSet);
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        if ( !getCardSet() ) {
            var cardSet= [
                [11, 12, 13, 14],
                [21, 22, 23, 24],
                [31, 32, 33, 34],
            ];

            CardSets.insert({ set: cardSet });
        }
    });
}
