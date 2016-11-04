/**
 *  Rule for daifugo game
 */
var cookie = require("cookie"),
    io = require("socket.io"),
    utils = require("../../../common/utils"),
    log4js = require('log4js'),
    logger = log4js.getLogger('DfgRule'),
    Dfggame = require('./Dfggame'),
    aiutils = require('./aiutils.js');
/*
 *   Generate all sub sets from collection with k-elements
 *   @function
 *
 *   @param {Array} arr: Array to get all subsets
 *   @param {Integer} k: Number elements in subset
 * */
var genAllShuffle = function (arr, k) {
    // Checking abnormal case
    if (arr.length < k || k == 0) {
        return [
            []
        ];
    }
    else {
        var ret = [];
        var nextset = arr.slice(1, arr.length);

        // Adding arr[0] and all subset with k - 1
        var nextgen = genAllShuffle(nextset, k - 1);
        for (var i = 0; i < nextgen.length; i++) {
            ret.push([arr[0]].concat(nextgen[i]));
        }

        // Adding all subset / {arr[0]} with k
        nextgen = genAllShuffle(nextset, k);
        for (var i = 0; i < nextgen.length; i++) {
            if (nextgen[i].length > 0) {
                ret.push(nextgen[i]);
            }
        }
        return ret;
    }
}

// Test
//var set = ['A', 'B', 'C', 'D'];
//logger.info(genAllShuffle(set, 2));
//logger.info(genAllShuffle(set, 2).length);



/*
 *
 *   @function
 *   Get type of current dealing cards
 *
 **/
var getDealType = function (Game) {
    if (Game.currentTourGame.mDCards.length == 0 || !Game.currentTourGame.mDCards[0].cards) {
        return aiutils.DealType.None;
    }
    else {
        var cards = Game.currentTourGame.mDCards[0].cards;
        var type = DealType.Sequ;
        if (cards.length < 2) {
            type = aiutils.DealType.Pair;
        }
        else {
            for (var i = 0; i < cards.length - 2; i++) {
                if (cards[i].mRank == cards[i + 1].mRank) {
                    type = aiutils.DealType.Pair;
                    break;
                }
            }
        }
        return type;
    }
}

/*
 *
 *
 *   @function
 *   Generate all subset from collection \ {}
 *   @param {Array} arr: Collection to generate
 *
 * */
var genAllSubset = function (arr) {
    var n = 1 << arr.length; // 2^array_len - 1 cases
    var ret = [];
    for (var index = 1; index < n; index++) {
        var subset = [];
        for (var k = 0; k < arr.length; k++) {
            if ((index & (1 << k)) != 0) {
                subset.push(arr[k]);
            }
        }
        ret.push(subset);
    }
    return ret;
}

//var set = ['A', 'B', 'C', 'D', 'E'];
//logger.info(genAllSubset(set));
//logger.info(genAllSubset(set).length);

/*
 *
 *   @function
 *   Get all pair solution
 *
 * */
var getAllPair = function (cards) {
    var ret = [];
    if (cards.length > 0) {
        var pairs = [];
        var pair = [cards[0]];
        for (var i = 1; i < cards.length; i++) {
            if (cards[i].mRank != cards[i - 1].mRank) {
                pairs.push(pair.slice(0));
                pair = [cards[i]];
            }
            else {
                pair.push(cards[i]);
            }
        }
        pairs.push(pair.slice(0));
        // Check with joker
        if (cards[cards.length - 1].mRank == aiutils.Card_Joker) {
            for (var i = 0; i < pairs.length - 1; i++) {
                var subsets = genAllSubset(pairs[i]);
                ret = ret.concat(subsets);
                for(var j = 0; j < subsets.length; j++){
                    var subset = subsets[j].slice(0);
                    subset.push(cards[cards.length - 1]);
                    ret.push(subset);
                }
            }
            //ret.push(pairs[pairs.length - 1]);
            ret.push([cards[cards.length - 1]]);
        }
        else{
            // With normal case
            for (var i = 0; i < pairs.length; i++) {
                var subsets = genAllSubset(pairs[i]);
                ret = ret.concat(subsets);
            }
        }
    }
    return ret;
}

/*
*
*       @function
*       Get all sequence with value[0] = k in array
*   @param {Array} arr: Array of cards
*   @param {Integer} k: Number to compare
* */
var fnGetSequence = function(arr, k){
    var ret = [];
    for(var i = 0; i < arr.length && arr[i].mRank == k + i; i++){
        ret.push(arr[i]);
    }
    return ret;
}

/*
 *
 *   @function
 *   Get all sequence solution
 *
 * */
var getAllSequence = function (cards) {
    var ret = [];

    if (cards.length > 0) {
        for (var color = 0; color < 4; color++) {
            var scards = [];

            // Find all array color card
            for (var i = 0; i < cards.length; i++) {
                if (cards[i].mColor == color){
                    scards.push(cards[i]);
                }
            }

            if (cards[cards.length - 1].mRank == aiutils.Card_Joker){
                // Find all A1 A2 A3 sequences
                // Get solution sequence with A1Joker A2Joker ...
                for(var i = 0; i < scards.length - 1; i++){
                    // For: 6 JK ...
                    var cscards = fnGetSequence(scards.slice(i + 1, scards.length), scards[i].mRank + 2);
                    if (cscards.length >= 1){
                        for(var j = 0; j < cscards.length; j++){
                            ret.push([scards[i], cards[cards.length - 1]].concat(cscards.slice(0, cscards.length - j)));
                        }
                    }

                    // Normal Sequence: 6 7 8
                    cscards = fnGetSequence(scards.slice(i + 1, scards.length), scards[i].mRank + 1);
                    if (cscards.length >= 2){
                        for(var j = 0; j < cscards.length - 1; j++){
                            logger.info("Normal Sequence");
                            logger.info([scards[i]].concat(cscards.slice(0, cscards.length - j)));
                            ret.push([scards[i]].concat(cscards.slice(0, cscards.length - j)));
                        }
                    }

                    // With Joker
                    if (cscards.length >= 1){
                        for(var j = 0; j < cscards.length; j++){
                            // For 6 7 JK, 6 7 8 JK
                            var squence = [scards[i]].concat(cscards.slice(0, cscards.length - j + 1)).concat([cards[cards.length - 1]]);
                            ret.push(squence);

                            // For 6 7 JK 9
                            var cnscards = fnGetSequence(scards.slice(i + j + 2, scards.length),
                                cscards[cscards.length - j - 1].mRank + j + 2);
                            for(var k = 0; k < cnscards.length; k++){
                                ret.push(squence.concat(cnscards.slice(0, cnscards.length - k)));
                            }
                        }
                    }
                }
            }
            else{
                // Find all A1A2A3... sequence
                for(var i = 0; i < scards.length - 2; i++){
                    var cscards = fnGetSequence(scards.slice(i + 1, scards.length), scards[i].mRank + 1);
                    if (cscards.length >= 2){
                        // Example: 6789 JQ --> a[0] = 6
                        // fnGetSequence(789 JQ, 6) = 789
                        // --> 2 solutions: 678 and 6789
                        for(var j = 0; j < cscards.length - 1; j++){
                            ret.push([scards[i]].concat(cscards.slice(0, cscards.length - j)));
                        }
                    }
                }
            }

        }
    }
    return ret;
}

// Testing
function Card(rank, color) {
    this.mRank = rank;
    this.mColor = color;
}
//var mCards = [];
//mCards.push(new Card(3, 3));
//mCards.push(new Card(5, 3));
//mCards.push(new Card(6, 2));
//mCards.push(new Card(7, 3));
//mCards.push(new Card(8, 3));
//mCards.push(new Card(9, 3));
//mCards.push(new Card(11, 0));
//mCards.push(new Card(11, 3));
//mCards.push(new Card(12, 2));
//mCards.push(new Card(12, 3));
//mCards.push(new Card(14, 2));
//mCards.push(new Card(15, 3));
//mCards.push(new Card(16, 4));
//var ret = getAllSequence(mCards);
//logger.info(ret);

//
//debugger


/*
 *
 *   @function
 *   Get all dealing solutions
 *
 * */
var getAllDealingCards = function (cards) {
    return getAllPair(cards).concat(getAllSequence(cards));
}

/*
 *
 *       @function
 *   Generate all possible solutions
 *   @param {CardGames} Game
 *
 * */
var RuleCard = function (Game) {
    var me = this;
    this.game = Game;

    this.getAllDealingCards = function () {
    }
}

module.exports = {
    GameRule: RuleCard, getAllDealingCards: getAllDealingCards
};