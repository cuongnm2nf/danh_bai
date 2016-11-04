// Number of Joker card
var Card_Joker = 16;
exports.Card_Joker = Card_Joker;

/*
 *
 *       @enum
 *   Dealabel type card
 *
 * */
var DealType = {
    None: 0, // None for dealing
    Pair: 1, // Dealing tour is pair (33, 444, 5555, 66666)
    Sequ: 2  // 345 ...
}

module.exports.DealType = DealType;

/** @enum
 *
 *  Enum describing card color:
 *  - 4 normal colors
 *  - 1 joker color
 *
 */
exports.Card_Color = {
    c: 0, // Clubs
    d: 1, // Diamonds
    h: 2, // Hearts
    s: 3, // Spades
    j: 4  // Joker
}

/*
*
*   @function
*   Detect dealing cards
*
* */
function typeDealing(cards){
    if (cards.length <= 2){
        return DealType.Pair;
    }
    else{
        var type = DealType.Sequ;
        var rank = cards[0].mRank;
        for(var i = 1; i < cards.length; i++){
            if (cards[i].mRank == rank){
                type = DealType.Pair;
                break;
            }
        }
        return type;
    }
}

// Testing
function Card(rank, color) {
    this.mRank = rank;
    this.mColor = color;
}
//var cards = [new Card(4, 0), new Card(16, 4), new Card(6, 0)];
//
//var type = typeDealing(cards);
//console.log(type);

/*
*
*   @function
*   compare two solutions
*   -3: Joker
*   -2: less than and locking hand Ex: 5b 5c < 6b 6c
*   -1: less than Ex:   5c 5h < 6h 6b
*   0: Not comparable Ex: 6b 6c ncm 5h 5b 5c; 6b 7b 8b ncm 5h 5b 5c ...
*   1: large than
*   2: large than and locking hand
*   3: Joker
*
* */
var cardsCompare = function (cardsX, cardsY) {
    var type = typeDealing(cardsX), len = cardsX.length;
    if (type == typeDealing(cardsY) && len == cardsY.length) {
        if (type == DealType.Pair){
            if (cardsX[0].mRank < cardsY[0].mRank){
                var nsame = 0, joker = false;
                for(var i = 0; i < len; i++){
                    var ksame = 1;
                    for(var j = 0; j < len; j++){
                        if (cardsX[i].mColor == cardsY[j].mColor){
                            ksame = 0;
                        }
                        else{
                            if (cardsY[j].mRank == Card_Joker || cardsX[i].mRank == Card_Joker){
                                joker = true;
                            }
                        }
                    }
                    nsame += ksame;
                }
                if (nsame == 0){
                    return -2;
                }
                else{
                    if (nsame == 1 && joker){
                        return -3;
                    }
                    return -1;
                }
            }
        }
        else{
            // Sequence
            if (cardsX[0].mRank  + len<= cardsY[0].mRank){
                if (cardsX[0].mColor == cardsY[0].mColor){
                    var joker = false;
                    for(var i = 0; i < len; i++){
                        if (cardsY[i].mRank == Card_Joker || cardsX[i].mRank == Card_Joker){
                            joker = true;
                            break;
                        }
                    }
                    if (joker){
                        return -3;
                    }
                    return -2;
                }
                return -1;
            }
            else{
                if (cardsY[0].mRank <= cardsX[0].mRank + len){

                }
            }
            return 0;
        }
    }
    return 0;
}

module.exports.cardsCompare = cardsCompare;

/*
*
*       Check revolution function
*
* */
module.exports.isRevolution = function(cards){
    return typeDealing(cards) == DealType.Pair && cards.length >= 4;
}

/*
*
*       Check Locking Hand function
*
* */
module.exports.isLockingHand = function(cardsX, cardsY){
    return cardsCompare(cardsX, cardsY) == -2;
}

/*
*       Check eight cut function
*/
module.exports.isEightCut = function(cards){
    var ret = false;
    for(var i = 0; i < cards.length && !ret; i++){
        if (cards[i].mRank == 8){
            ret = true;
        }
    }
    return ret;
}

var cards = [new Card(4, 0), new Card(16, 4), new Card(4, 1)];
var cards2 = [new Card(5, 0), new Card(5, 1), new Card(5, 2)];

var ret = cardsCompare(cards, cards2);
console.log(ret);

