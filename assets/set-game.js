
jQuery(function($) {

// ============================================================================
//      Globals
// ============================================================================

    var conf= {};
    var deck= [];

// ============================================================================
//      Utility Functions
// ============================================================================

    var strcmp= function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    };

    var intcmp= function(a, b) {
        a= parseInt(a);
        b= parseInt(b);
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    };

    // ========================================================================
    //   DOM Event handlers
    // ========================================================================

    var cmds= {};

    // Taken from Rabak
    // Dispatches clicks to functions defined in cmds[]
    $('a').live('click', function() {
        console.log("Clicked:", $(this).attr('href'));

        if ($(this).hasClass('disabled')) return;
        var href= $(this).attr('href');

        // Not an internal link, pass on to browser
        if (href.substr(0, 1) != '#') return true;

        var paramsl= href.substr(1).split(/[:=]/);
        var cmd= paramsl.shift();
        var cmdFn= cmds[cmd];
        if (!cmdFn) {
            console.error('Command "' + cmd + '" not defined');
            return false;
        }

        var params= {};
        while (paramsl.length) {
            var key= paramsl.shift();
            params[key]= paramsl.shift();
        }

        return cmdFn(params);
    });

    var Card= function(pos) {

        var face= -1;

        var selected= function() {
            return $('#card' + pos).hasClass("selected");
        };

        var deselect= function() {
            return $('#card' + pos).removeClass("selected");
        };

        var select= function() {
            if (face >= 0) $('#card' + pos).addClass("selected");
        };

        var show= function() {
            var num= face;
            var fill=   num % 3; num = Math.floor(num / 3);
            var motive= num % 3; num = Math.floor(num / 3);
            var color=  num % 3; num = Math.floor(num / 3);
            var html= [];
            var x= fill * 96 + color * 32;
            var y= motive * 64;
            while (num >= 0) {
                html.push("<div class='card-elem' style='background: transparent url(assets/card.png) no-repeat -",
                    x, "px -", y, "px'></div>");
                num--;
            }
            $('#card' + pos).html(html.join(''));
        };

        var setFace= function(face_) {
            face= face_;
            show();
            deselect();
        };

        var getFace= function() {
            return face;
        };

        this.setFace= setFace;
        this.getFace= getFace;
        this.show= show;
        // this.selected= selected;
        this.select= select;
        this.deselect= deselect;
        return this;
    }

    // ============================================================================
    //      Commands
    // ============================================================================

    cmds.show_dashboard= function(params) {

        params= $.extend(params, { job: '*' });
    };

    // ============================================================================
    //      Cards
    // ============================================================================

    var _deck_selected= [];
    var _deck_solutions= null;

    var cards= [];

    var cards_init= function() {
        var html= [];
        var id= 0;
        html.push("<table>");
        for (var y= 0; y < 3; y++) {
            html.push("<tr>");
            for (var x= 0; x < 4; x++) {
                var id= y + x * 3;
                html.push("<td><div class='card' id='card", id, "'></div></td>");
            }
            html.push("</tr>");
        }
        html.push("</table>");
        $("#cards").html(html.join(''));

        for (var i= 0; i < 12; i++) {
            cards.push(new Card(i));
        }
    };

    var cards_refresh= function() {

        _deck_selected.length == 3
            ? $("#cards").addClass("set-fail")
            : $("#cards").removeClass("set-fail");

        var lookup= deck_selected_lookup();
        for (var i= 0; i < 12; i++) {
            var face= cards[i].getFace();
            if (face < 0) continue;
            lookup[face] ? cards[i].select() : cards[i].deselect();
        }
    };

    var card_by_face= function(face) {
        for (var i= 0; i < 12; i++) {
            if (cards[i].getFace() == face) return cards[i];
        }
        return null;
    };

    var show_status= function() {
        var count= deck_solutions().length > 0;
        $("#solutions").text(count);
    };

    // ============================================================================
    //      Deck
    // ============================================================================

    var deck_init= function() {
        for (var i= 0; i < 81; i++) deck[i]= i;
        for (var i= 0; i < 81; i++) {
            var n= Math.floor(Math.random() * 81);
            var tmp= deck[i];
            deck[i]= deck[n];
            deck[n]= tmp;
        }
        for (var i= 0; i < 12; i++) cards[i].setFace(deck[i]);
    }

    var deck_selected_lookup= function() {
        var result= {};
        for (var i= 0; i < _deck_selected.length; i++) {
            result[_deck_selected[i]]= i + 1;
        }
        return result;
    };

    var deck_deselect_all= function() {
        _deck_selected= [];
        cards_refresh();
    };

    var deck_selected= function(deck_i) {
        for (var i= 0; i < _deck_selected.length; i++) {
            if (_deck_selected[i] == deck_i) return true;
        }
        return false;
    }

    var deck_toggle_select= function(deck_i) {
        for (var i= 0; i < _deck_selected.length; i++) {
            if (_deck_selected[i] == deck_i) {
                _deck_selected.splice(i, 1);
                cards_refresh();
                return;
            }
        }
        _deck_selected.push(deck_i);
        cards_refresh();
    };

    var deck_solutions= function() {

        if (_deck_solutions) return _deck_solutions;

        var result= [];

        var check= [];
        for (var i= 0; i < 12 && i < deck.length; i++) {
            var face= deck[i];
            var one= [ face ];
            for (var j= 0; j < 4; j++) {
                one.push(face % 3);
                face = Math.floor(face / 3);
            }
            check.push(one.concat());
        }

        for (var i0= check.length - 1; i0 >= 2; i0--) {
            for (var i1= i0 - 1; i1 >= 1; i1--) {
                for (var i2= i1 - 1; i2 >= 0; i2--) {
                    var check0= check[i0];
                    var check1= check[i1];
                    var check2= check[i2];
                    var prop_i= 4;
                    for (; prop_i > 0; prop_i--) {
                        if ((check0[prop_i] != check1[prop_i]
                                || check1[prop_i] != check2[prop_i])
                            && (check0[prop_i] == check1[prop_i]
                                || check1[prop_i] == check2[prop_i]
                                || check2[prop_i] == check0[prop_i])
                            ) break;
                    }
                    if (prop_i > 0) continue;

                    console.log([ i2, i1, i0 ]);

                    var one= [ check0[0], check1[0], check2[0] ];
                    one.sort(intcmp);
                    result.push(one.concat());
                }
            }
        }

        // console.log(result);
        // console.log({ c: check, r: result });

        return _deck_solutions= result;
    };

    var deck_next_cards= function() {

        var ch_cards= [];
        var lookup= deck_selected_lookup();

        for (var deck_i= 0; deck_i < 12 && deck_i < deck.length; deck_i++) {
            var face= deck[deck_i];
            if (!lookup[face]) continue;

console.log("rem", deck_i);
            deck.splice(deck_i, 1);
            var card= card_by_face(face);
            if (card) ch_cards.push(card);
            deck_i--;
        }


        if (ch_cards.length) {
console.log(ch_cards);

            var deck_i= 12 - ch_cards.length;
            for (var i in ch_cards) {

console.log(deck_i);


                card= ch_cards[i];
                card.setFace(deck_i < deck.length ? deck[deck_i] : -1);
                deck_i++;
            }
        }

        _deck_selected= [];
        _deck_solutions= null;
        cards_refresh();

        return;


        var lookup= deck_selected_lookup();
        var j= 0;
        for (var i in lookup) {
        }

        var card_is= [];
        for (var i= 0; i < _deck_selected.length; i++) {
            var face= _deck_selected[i];
            for (var j= 0; j < 12; j++) {
                if (deck[j] == face) {
                    deck.splice(j, 1);
                    var card= card_by_face(face);
                    if (card) card.setFace(deck.length < 12 ? -1 : deck[11]);
                    break;
                }
            }
        }
        _deck_selected= [];
        _deck_solutions= null;
        cards_refresh();
    };

    var deck_check_solution= function() {
        if (_deck_selected.length != 3) return;

        _deck_selected.sort(intcmp);

                deck_next_cards(); return;


        var solutions= deck_solutions();
        for (var i= 0; i < solutions.length; i++) {
            var sol= solutions[i];
            if (sol[0] == _deck_selected[0] && sol[1] == _deck_selected[1] && sol[2] == _deck_selected[2]) {
                deck_next_cards();
                break;
            }
        }
    };

    // ============================================================================
    //      Behaviours
    // ============================================================================

    $('.card').live('click', function(ev) {
        var face= cards[parseInt(this.id.substr(4))].getFace();
        if (!deck_selected(face) && _deck_selected.length >= 3) deck_deselect_all();
        deck_toggle_select(face);
        deck_check_solution();
        show_status();
        return false;
    });

    $('body').live('click', function(ev) {
        deck_deselect_all();
    });

    // ============================================================================
    //      Main
    // ============================================================================

    cards_init();
    deck_init();

//    deck.unshift(

    for (var i= 0; i < 12; i++) cards[i].setFace(deck[i]);
    show_status();

});
