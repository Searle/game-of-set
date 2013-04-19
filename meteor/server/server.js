
Meteor.startup(function () {
    var game= loadGame();

    if ( !game || !game.visibleCards  ) {
        initGame();
    }
});
