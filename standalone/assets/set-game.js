
jQuery(function($) {

// ============================================================================
//      Globals
// ============================================================================

    var conf= {};

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

    var shuffle= function(arr) {
        for (var i= 0; i < arr.length; i++) {
            var n= Math.floor(Math.random() * arr.length);
            var tmp= arr[i];
            arr[i]= arr[n];
            arr[n]= tmp;
        }
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
    //      Card Stack
    // ============================================================================

    var CardStack= function() {
        var _stack= [];
        var _solutions= null;

        var add= function(faces) {
            $.each($.makeArray(faces), function(_, face) {
                _stack.push(face);
            });
            _solutions= null;
        };

        var removeFace= function(faces) {
            $.each($.makeArray(faces), function(_, face) {
                var i= $.inArray(face, _stack);
                if (i >= 0) _stack.splice(i, 1);
            });
            _solutions= null;
        };

        var pull= function() {
            _solutions= null;
            return _stack.shift();
        };

        var _shuffle= function() {
            shuffle(_stack);
        };

        var solutions= function(force) {

            if (!force && _solutions) return _solutions;

            var check= [];
            for (var i= 0; i < _stack.length; i++) {
                var face= _stack[i];
                var one= [ face ];
                for (var j= 0; j < 4; j++) {
                    one.push(face % 3);
                    face = Math.floor(face / 3);
                }
                check.push(one.concat());
            }

            _solutions= [];
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

                        // console.log([ i2, i1, i0 ]);

                        var one= [ check0[0], check1[0], check2[0] ];
                        one.sort(intcmp);
                        _solutions.push(one.concat());
                    }
                }
            }
            return _solutions;
        };

        // FIXME: sane name
        var pull2= function(basis, count) {
            var result= [];
            for (var i= basis.length; i < count; i++) {
                result.push(pull());
            }
            return result;
        };

        // FIXME: sane name
        var pull3= function(basis, count) {
            var by_sols= [ _stack.concat(), null, null, null ];

// console.log("basis:", basis);
// console.log("stack:", _stack);

            for (var r= 0; r < 100; r++) {

                _stack= basis.concat();
                for (var i= 0; basis.length + i < count && i < by_sols[0].length; i++) {
                    _stack.push(by_sols[0][i]);
                }
                var n= solutions(true).length;
                if (n > 0 && n < 4 && !by_sols[n]) {
                    by_sols[n]= by_sols[0].concat();
                    if (n == 1) break;  // short circuit
                }
                shuffle(by_sols[0]);
            }

            var n= 0;
            if (by_sols[1]) n= 1;
            else if (by_sols[2]) n= 2;
            else if (by_sols[3]) n= 3;

// console.log("bysol:", by_sols);
// console.log("bysol:", by_sols[n]);

            _stack= by_sols[n].concat();
            _solutions= null;

            return pull2(basis, count);
        };

        var getStack= function() {
            return _stack;
        };

        var getFace= function(i) {
            if (i >= _stack.length) return -1;
            return _stack[i];
        };

        var getCount= function(i) {
            return _stack.length;
        };

        this.add= add;
        this.pull= pull;
        this.pull2= pull3;
        this.removeFace= removeFace;
        this.shuffle= _shuffle;
        this.solutions= solutions;
        this.stack= getStack;
        this.get= getFace;
        this.count= getCount;
        return this;
    };

    // ============================================================================
    //      Visible Cards
    // ============================================================================

    var VisibleCards= function(hdeck, vcards_n) {
        var _vdeck= new CardStack();
        var _selected= [];
        var _cards= [];

        var selected_lookup= function() {
            var result= {};
            for (var i= 0; i < _selected.length; i++) {
                result[_selected[i]]= i + 1;
            }
            return result;
        };

        var _refresh= function() {

            _selected.length == 3
                ? $("#cards").addClass("set-fail")
                : $("#cards").removeClass("set-fail");

            var lookup= selected_lookup();
            for (var i= 0; i < _cards.length; i++) {
                var face= _cards[i].getFace();
                if (face < 0) continue;
                lookup[face] ? _cards[i].select() : _cards[i].deselect();
            }

            var count= _vdeck.solutions().length;
            $("#solutions").text(count);
        };

        var card_by_face= function(face) {
            for (var i= 0; i < _cards.length; i++) {
                if (_cards[i].getFace() == face) return _cards[i];
            }
            return null;
        };

        var init_game= function() {
            _vdeck.add(hdeck.pull2(_vdeck.stack(), _cards.length));

            for (var i= 0; i < _cards.length; i++) _cards[i].setFace(_vdeck.get(i));
            _refresh();
        }

        var deselect_all= function() {
            _selected= [];
            _refresh();
        };

        var is_selected= function(face) {
            for (var i= 0; i < _selected.length; i++) {
                if (_selected[i] == face) return true;
            }
            return false;
        }

        var toggle_select= function(face) {
            for (var i= 0; i < _selected.length; i++) {
                if (_selected[i] == face) {
                    _selected.splice(i, 1);
                    _refresh();
                    return;
                }
            }
            _selected.push(face);
            _refresh();
        };

        var next_cards= function() {

            _vdeck.removeFace(_selected);

            var faces= hdeck.pull2(_vdeck.stack(), _cards.length);
            var vdeck_i= _vdeck.count();
            _vdeck.add(faces);

            for (var i= 0; i < _selected.length; i++) {
                var card= card_by_face(_selected[i]);
                if (card) card.setFace(_vdeck.get(vdeck_i++));
            }

            _selected= [];
            _solutions= null;
            _refresh();
        }

        var check_solution= function() {
            if (_selected.length != 3) return;

            // next_cards(); return;

            _selected.sort(intcmp);

            var solutions= _vdeck.solutions();
            for (var i= 0; i < solutions.length; i++) {
                var sol= solutions[i];
                if (sol[0] == _selected[0] && sol[1] == _selected[1] && sol[2] == _selected[2]) {
                    next_cards();
                    break;
                }
            }
        };

        var init= function() {
            var html= [];
            var id= 0;

            // FIXME: only works with 12 cards atm
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

            for (var i= 0; i < vcards_n; i++) {
                _cards.push(new Card(i));
            }

            $('.card').live('click', function(ev) {
                var face= _cards[parseInt(this.id.substr(4))].getFace();
                if (!is_selected(face) && _selected.length >= 3) deselect_all();
                toggle_select(face);
                check_solution();
                // show_status();
                return false;
            });

            $('body').live('click', function(ev) {
                deselect_all();
            });
        };

        init();

        this.init_game= init_game;
        return this;
    };


    // ============================================================================
    //      Behaviours
    // ============================================================================

    // ============================================================================
    //      Main
    // ============================================================================

    var hdeck= new CardStack();
    for (var i= 0; i < 81; i++) hdeck.add(i);
    hdeck.shuffle();

    var vcards= new VisibleCards(hdeck, 12);
    vcards.init_game();

    // ============================================================================
    //      Cards
    // ============================================================================


//    cards_init();
//    deck_init();

//    for (var i= 0; i < 12; i++) cards[i].setFace(deck[i]);
//    show_status();

});
