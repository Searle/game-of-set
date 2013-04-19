
// public
Games = new Meteor.Collection("games");

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

// public
Card= function( num, row, col ) {

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

Card.matches= function( c1, c2, c3 ) {
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

// public
Game= function() {
};

Game.load= function() {
    return Games.findOne();
};

Game.init= function() {
    var game= Game.load();

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
