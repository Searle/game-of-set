CardSets = new Meteor.Collection("cardSets");

if (Meteor.isClient) {
    Template.cardSet.row= function() {
        var cardSet= CardSets.findOne();
        if ( cardSet ) return cardSet.set.map(function( v ) { return {cards: v}; });
    }
    Template.cardSet.col= function(row) {
        return row.map(function( v ) { return {card: v}; });
    }
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        if (CardSets.find().count() === 0) {
            var cardSet= [
                [11, 12, 13, 14],
                [21, 22, 23, 24],
                [31, 32, 33, 34],
            ];

            CardSets.insert({ set: cardSet });
        }
    });
}
