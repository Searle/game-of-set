var Games = new Meteor.Collection("games");

var loadGame= function() {
    return Games.findOne();
};

var Card= function( num, row, col ) {

    this.row= row;
    this.col= col;

    this.setFace= function( num ) {
        this.num= num;

        if ( typeof num === 'number' ) {
            this.fill=   num % 3; num = Math.floor(num / 3);
            this.motive= num % 3; num = Math.floor(num / 3);
            this.color=  num % 3; num = Math.floor(num / 3);
            this.count=  num % 3 + 1;
        }
        else {
            this.fill=   0;
            this.motive= 0;
            this.color=  0;
            this.count=  0;
        }

        this.cssX= this.fill * 96 + this.color * 32;
        this.cssY= this.motive * 64;
    }

    this.setFace(num);
}

Card.prototype.key= function() {
    return this.row + "-" + this.col;
};

var cardsMatch= function( c1, c2, c3 ) {
    var matches= true;

    [ 'fill', 'motive', 'color', 'count' ].forEach(function( type ) {
        t1= c1[type];
        t2= c2[type];
        t3= c3[type];
        matches= matches && ((t1 === t2 && t1 === t3) || (t1 !== t2 && t2 !== t3 && t1 !== t3));
    });
    return matches;
}

var shuffle= function( arr ) {
    for ( var i= 0; i < arr.length; i++ ) {
        var n= Math.floor(Math.random() * arr.length);
        var tmp= arr[i];
        arr[i]= arr[n];
        arr[n]= tmp;
    }
};

var initGame= function() {
    var game= loadGame();

    if ( game ) {
        round= game.round;
        Games.remove({ _id: game._id });
    }

    var cardStack= [];
    for ( var i= 3 * 3 * 3 * 3 - 1; i >= 0; i-- ) {
        cardStack.push(i);
    }

    shuffle(cardStack);

    var visibleCards= [];
    for ( var r= 0; r < 4; r++ ) {
        var row= [];
        visibleCards.push(row);
        for ( var c= 0; c < 4; c++ ) {
            row.push(cardStack.shift());
        }
    }

    Games.insert({ visibleCards: visibleCards, cardStack: cardStack, round: 0, });
};

if ( Meteor.isClient ) {

    var gameId;
    var cardSet= [];
    var round;

    var buildCards= function() {
        var game= loadGame();

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
            initGame();
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
        var cardElem= {cssX: card.cssX, cssY: card.cssY};
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

            if ( cardsMatch(selectedCards[0], selectedCards[1], selectedCards[2]) ) {
                console.log("MATCH")
                var game= loadGame();

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
}

if ( Meteor.isServer ) {
    Games.allow({
        update: function( userId, doc, fieldNames, modifier ) {
            var nextRound= doc.round + 1;
            return modifier && modifier['$set'] && modifier['$set'].round === nextRound;
        },
        insert: function( userId, doc ) {
            return true;
        },
        remove: function( userId, doc ) {
            return true;
        },
    })
    Meteor.startup(function () {
        var game= loadGame();
        if ( !game || !game.visibleCards  ) {
            initGame();
        }
    });
}
