
Meteor.startup(function () {
    var game= Game.load();

    if ( !game || !game.visibleCards  ) {
        Game.init();
    }
});

Meteor.methods({
    shuffle: function() {
        Game.init();
    }
});
