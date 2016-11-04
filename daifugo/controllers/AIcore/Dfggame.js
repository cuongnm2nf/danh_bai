/*
 *
 *
 *               Create the Game management Objects for Daifugo game
 *
 *
 * */
var utils = require("../../../common/utils"),
    log4js = require('log4js'),
    logger = log4js.getLogger('ConnectHandler'),
    GameRule = require('./DfgRule'),
    aiutils = require('./aiutils');

var DfgAI = require('./DfgAI');

/***********************************
 *   Card object to play a game
 *
 *   1 : Ace
 *   2 <= i <= 10 : card rank i-th
 *   11: Jack
 *   12: Queen
 *   13: King
 *   14: Joker
 ************************************/

// Enum for card color


/** @constructor
 *
 *  Card initiation
 *  @this {Card}
 * @param {Number} rank
 * @param {Card.Color} color
 *
 */
function Card(rank, color) {
    this.mRank = rank;
    this.mColor = color;
    this.index = null;
}

/** @enum
 *
 *  Enum describing card color:
 *  - 4 normal colors
 *  - 1 joker color
 *
 */
Card.Color = {
    c: 0, // Clubs
    d: 1, // Diamonds
    h: 2, // Hearts
    s: 3, // Spades
    j: 4  // Joker
}


// Number of Joker card
Card_Joker = aiutils.Card_Joker;

/*
*
*   Compare function
*   @function
*   @param {Card}cx
*   @param {Card}cy
*   return -1 if cx < cy; 0 if cx == cy; 1 if cx > cy
**/
var CardcmpPositive = function(cx, cy){
    return cx.mRank*5 - cy.mRank*5 + cx.mColor - cy.mColor;
}


//************************************
/** @constructor
 *
 *  Create instance of PlayerGame
 * @this {PlayerGame}
 * @param {GameCards} game
 * @param {PlayerGame.Type} type
 * @param {PlayerGame.Level} level
 *
 */
function PlayerGame(game, type, level) {
    this.mGame = game;
    this.mType = type;
    this.mLevel = level;
    this.mCards = [];
    this.nextPlayer = null;
    this.prevPlayer = null;
    this.status = PlayerStatus.Normal;
    this.dSolution = [];
    this.mIndex = 0;
    this.lenCards = 0;

    this.setGame = function (game) {
        this.mGame = game;
    }

    this.setType = function (type) {
        this.mType = type;
    }

    this.setLevel = function (level) {
        this.mLevel = level;
    }

    this.addCard = function (card) {
        card.deal = false;
        this.mCards.push(card);
        this.lenCards++;
    }

    this.setdSolution = function(solutions){
        this.dSolution = solutions;
        this.cdSolution = solutions.slice(0, solutions.length);
    }

    this.removeSolution = function(cards){
        var nsame = 0;
        logger.info("Dealed cards");
        logger.info(cards);
        var solutionclons = this.dSolution.slice(0, this.dSolution.length);
        var newdsolution = [];     // TODO: Revert the previous version for the performance
        for(var i = 0; i < this.dSolution.length; i++){
            var find = false;
            for(var k = 0; k < this.dSolution[i].length && !find; k++){
                for(var j = 0; j < cards.length; j++){
                    if (cards[j].index == this.dSolution[i][k].index){
                        this.mCards[cards[j].index].deal = true;
                        find = true;
                        break;
                    }
                }
            }
            if (find){
                nsame++;
                logger.info("Removed cards");
                logger.info(this.dSolution[i]);
            }
            else{
                newdsolution.push(this.dSolution[i]);
            }
        }

        //this.dSolution = this.dSolution.slice(0, this.dSolution.length - nsame);
        this.dSolution = newdsolution;

        this.lenCards -= cards.length; // TODO: check this member is not set to 0 when all cards are removed
        if (this.dSolution.length == 0){
            return true; // Finish my cards
        }
        else{
            return false;
        }
    }

    /*
    *   @function
    *   @param {TourGame} Tour
    *
    * */
    this.cutSolution = function(){
        // TODO: processing with lock handing, revolution
        var Tour = game.currentTourGame;
        var thres = Tour.bLock?-1:0;
        if (Tour.mDCards.length > 0){
            logger.info("Not Use dSolution");
            var ret = [];
            for(var i = 0; i < this.dSolution.length; i++){
                var d = aiutils.cardsCompare(Tour.cardsLock, this.dSolution[i]);
                if (d < thres){
                    ret.push(this.dSolution[i]);
                }
                else{
                    logger.info("Not Use this solution: ");
                    logger.info(this.dSolution[i]);
                }
            }
            return ret;
        }
        else{
            logger.info("Use dSolution");
            logger.info(this.dSolution);
            return this.dSolution;
        }
    }

    /*
    *
    *       AI Game
    *
    *
    **/
    this.findSolution = function(){
        // TODO: find solution following level
        var mySolutions = this.cutSolution();
        return DfgAI.findSolution(mySolutions, 0, [], [], null, null);
    }
}

/** @enum
 *
 *  Enum describing Player type:
 *  - CPU
 *  - Human
 *
 */
PlayerType = {
    CPU: 0,
    Human: 1
}

/** @enum
 *
 *  Enum describing Player level:
 *  - Easy
 *  - Normal
 *  - Hard
 */
PlayerLevel = {
    Easy: 0,
    Normal: 1,
    Hard: 2
}

/**
 *      @enum
 *      Player Status
 */
PlayerStatus = {
    Normal: 0,
    Daifugo: 1,
    Fugo: 2,
    Hinmin: 3,
    Daihinmin: 4
};

//************************************

/** @constructor
 *
 *  Create an instance of TourGame
 *  @this {TourGame}
 *  @param {GameCards} game
 *  @param {PlayerGame} firstPlayer
 */
function TourGame(game, firstPlayer) {
    this.mDCards = [];
    this.bLock = false;
    this.bRevolution = false;
    this.isEightCut = false;
    this.cPlayer = firstPlayer;
    this.tableDealer = [];
    this.cardsLock = [];

    // Create the table dealer
    for(var i = 0; i < game.mPlayers.length; i++){
        if (game.mPlayers[i].status == PlayerStatus.Normal){
            this.tableDealer[i] = true;
        }
        else{
            this.tableDealer[i] = false;
        }
    }

    // Player deal a cards set
    this.playerDealCard = function(icards){
        var dcards = [];
        // TODO: check by rules
        for(var i = 0; i < icards.length; i++){
            var card = this.cPlayer.mCards[icards[i].index];
            dcards.push(card);
        }

        this.isEightCut = aiutils.isEightCut(dcards);

        if (this.cardsLock){
            this.bLock = aiutils.isLockingHand(this.cardsLock, dcards);
        }

        if (icards.length > 0){
            this.cardsLock = icards;
            this.bRevolution = aiutils.isRevolution(dcards);
        }

        // TODO: reuse-code at here
        var isFinish = this.cPlayer.removeSolution(dcards);

        this.mDCards.push(new CardsDeck(this.cPlayer, dcards));

        this.tableDealer[this.cPlayer.mIndex] = true;
        // IsFinish
        if (isFinish){
            this.cPlayer.status = game.endingRank;
            this.cPlayer.prevPlayer.nextPlayer = this.cPlayer.nextPlayer;
            this.cPlayer.nextPlayer.prevPlayer = this.cPlayer.prevPlayer;
        }
        // Change the player
        this.cPlayer = this.cPlayer.nextPlayer;
        this.tableDealer[this.cPlayer.mIndex] = false;
        return isFinish;
    }

    // Change the status when the player pass card
    this.playerPassCard = function(){
        this.mDCards.push(new CardsDeck(this.cPlayer, []));
        this.tableDealer[this.cPlayer.mIndex] = false;
        this.cPlayer = this.cPlayer.nextPlayer;
        this.tableDealer[this.cPlayer.mIndex] = false;
    }

    // Check the ending game
    this.checkEndingTour = function (){
        for(var i = 0; i < this.tableDealer.length; i++){
            if (this.tableDealer[i] == true &&
                game.mPlayers[i].status == PlayerStatus.Normal){
                return false;
            }
        }
        return true;
    }

    // Get Solution
}

/** @constructor
 *
 *  Create an instance of CardsDeck
 *  @this {TourGame}
 *  @param {arr of Card} cards
 *  @param {PlayerGame} player
 */
function CardsDeck(player, cards) {
    this.player = player;
    this.cards = cards;
}
//***********************************

//************************************
/** @constructor
 *
 *  GameCards initiation
 *  @this {GameCards}
 *
 */
GameCards = function (){

    this.mPlayers = [];

    this.mTourGame = [];

    this.currentTourGame = null;

    this.endingRank = PlayerStatus.Normal;

    this.addPlayer = function (type, level) {
        var player = new PlayerGame(this, type, level);
        if (this.mPlayers.length > 0){
            this.mPlayers[this.mPlayers.length - 1].nextPlayer = player;
            player.prevPlayer = this.mPlayers[this.mPlayers.length - 1];
            player.nextPlayer = this.mPlayers[0];
            this.mPlayers[0].prevPlayer = player;
        }
        player.mIndex = this.mPlayers.length;
        this.mPlayers.push(player);
    }

    // Initiation the game
    this.init = function () {
        // Init the Cards
        var cards = [];

        // Init the normal card
        for (var i = 3; i < Card_Joker; i++) {
            for (var j = 0; j < Card.Color.j; j++) {
                cards.push(new Card(i, j));
            }
        }

        // Init the Joker card: Total 52 items cards
        cards.push(new Card(Card_Joker, Card.Color.j));

        // Shuffle random the cards
        cards = utils.shuffle(cards);

        // Adding card for the players
        for (var i = 0; i < cards.length; i++) {
            this.mPlayers[i % this.mPlayers.length].addCard(cards[i]);
        }

        // Build shuffle to the players
        var playerCars = [];
        for (var i = 0; i < this.mPlayers.length; i++) {
            playerCars.push(this.mPlayers[i].mCards);
        }
        playerCars = utils.shuffle(playerCars);

        // Sort all cards by rank
        for (var i = 0; i < this.mPlayers.length; i++) {
            this.mPlayers[i].mCards = playerCars[i];
            this.mPlayers[i].mCards.sort(
                function(a, b){
                    return CardcmpPositive(a, b)
                });
            for(var j = 0; j < this.mPlayers[i].mCards.length; j++){
                this.mPlayers[i].mCards[j].index = j;
            }
        }

        // Test for player 3
//        var mCards = [];
//        mCards.push(new Card(3, 3));
//        mCards.push(new Card(5, 3));
//        mCards.push(new Card(6, 2));
//        mCards.push(new Card(7, 2));
//        mCards.push(new Card(8, 3));
//        mCards.push(new Card(9, 3));
//        mCards.push(new Card(11, 0));
//        mCards.push(new Card(11, 3));
//        mCards.push(new Card(12, 2));
//        mCards.push(new Card(12, 3));
//        mCards.push(new Card(14, 2));
//        mCards.push(new Card(15, 3));
//        mCards.push(new Card(16, 4));
//
//        this.mPlayers[3].mCards = mCards;
//
//        this.mPlayers[3].dSolution = GameRule.getAllDealingCards(mCards);

        // Generate all dealing solution
        for (var i = 0; i < this.mPlayers.length; i++) {
            this.mPlayers[i].setdSolution(GameRule.getAllDealingCards(this.mPlayers[i].mCards));
        }

        // Init the first tournament
        this.currentTourGame = new TourGame(this, this.mPlayers[3]);
        this.mTourGame.push(this.currentTourGame);

        // Testing
        //this.currentTourGame.mDCards.push(new CardsDeck(this.mPlayers[0], [new Card(4, 0), new Card(4, 1)]));
        //this.currentTourGame.mDCards.push(new CardsDeck(this.mPlayers[0], [new Card(4, 0), new Card(5, 0), new Card(6, 0)]));
    };

    this.getMyCards = function(iplayer){
        var ret = {myCards: null, ortherCards: [], dealingCards: []};
        for (var i = 0; i < this.mPlayers.length; i++) {
            if (i == iplayer){
                ret.myCards = this.mPlayers[i].mCards;
            }
            else{
                ret.ortherCards.push(this.mPlayers[i].mCards.length);
            }
        }
        return ret;
    }

    this.getSolutions = function(iplayer){
        return this.mPlayers[iplayer].cutSolution();
    }

    this.getCurrentPlayer = function(){
        return this.currentTourGame.cPlayer.mIndex;
    }

    this.getDealingSolution = function(iPlayer){
        return this.mPlayers[iPlayer].cutSolution();
    }

    // Print the players cards on console
    this.printCards = function () {
        for (var i = 0; i < this.mPlayers.length; i++) {
            var s = "Cards of Player " + i + ": ";
            for (var j = 0; j < this.mPlayers[i].mCards.length; j++) {
                s += this.mPlayers[i].mCards[j].mRank + "-" + this.mPlayers[i].mCards[j].mColor + " ";
            }
            logger.info(s);
        }
    }

    // Decide the dealing cards
    // []: Pass card
    // [1, 3, 5]: Deal card indexes
    this.playerDecideCards = function(icards){
        var ret = {
            player: this.currentTourGame.cPlayer.mIndex,
            isPlayerFinish: false,
            status: PlayerStatus.Normal,
            gameFinish: false,
            nextPlayer: null,
            isBeginLock: this.currentTourGame.bLock,
            isBeginRevolution: this.currentTourGame.bRevolution,
            isTourFinish: false
        };

        if (icards.length > 0){
            var isFinish = this.currentTourGame.playerDealCard(icards);
            ret.isFinish = isFinish;
            ret.isBeginLock = this.currentTourGame.bLock && !ret.isBeginLock;
            ret.isBeginRevolution = this.currentTourGame.bRevolution && !ret.isBeginRevolution;
            if (isFinish){
                this.endingRank++;
                this.mPlayers[ret.player].status = this.endingRank;
                ret.status = this.endingRank;
            }
            if (ret.status == PlayerStatus.Hinmin){
                this.endingRank++;
                this.currentTourGame.cPlayer.status = PlayerStatus.Daihinmin;
                ret.gameFinish = true;
            }
        }
        else{
            // Checking the ending tournament
            this.currentTourGame.playerPassCard();
            if (this.currentTourGame.checkEndingTour()){
                logger.info("Ending tour");
                var newTour = new TourGame(this, this.currentTourGame.cPlayer);
                this.currentTourGame = newTour;
                this.mTourGame.push(newTour);
                ret.isTourFinish = true;
            }
        }
        ret.nextPlayer = this.currentTourGame.cPlayer.mIndex;
        logger.info("Current tour status");
        logger.info(ret);

        return ret;
    }

    // Check the valid turn
    this.verifyTurn = function(iplayer){
        return iplayer == this.currentTourGame.cPlayer.mIndex;
    }
}


// Test all objects
//var tGame = new GameCards();
//tGame.addPlayer(null, null);
//tGame.addPlayer(null, null);
//tGame.addPlayer(null, null);
//tGame.addPlayer(null, null);
//
//tGame.init();
//
//console.log(tGame.mPlayers[3].cutSolution());


//tGame.printCards();
//tGame.sendArrayUserCard();
//process.exit(1);


module.exports = {
    GameCard: GameCards, 'PlayerType': PlayerType, 'PlayerLevel': PlayerLevel, 'Joker': Card.Joker, PlayerStatus: PlayerStatus
};