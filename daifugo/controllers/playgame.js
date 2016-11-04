var constants = require("../constants")(),
    log4js = require('log4js'),
    logger = log4js.getLogger('PlayHandler'),
    utils = require("../../common/utils");
    DfGame = require("./AIcore/Dfggame");
// Table to get the messenger from server-client
// TODO send this table to the client
// Table to get the messenger from server-client
var MessageTable = {
    DO_SMTH: "DO_SMTH",
    RE_SMTH: "RE_SMTH",
    FIND_ROOM: "FIND_ROOM",
    ROOM_TALK: "ROOM_TALK",
    GET_NAME: "GET_NAME",
    GET_CARD: "GET_CARD",
    DEAL_CARD: "DEAL_CARD",
    PASS_CARD: "PASS_CARD",
    EXCHANGE_CARD: "EXCHANGE_CARD",
    GAME_STATUS: "GAME_STATUS",
    GET_SOLUTION: "GET_SOLUTION",
    GET_RESULT: "GET_RESULT",
    CREATE_PLAY: "CREATE_PLAY"
};

var TimeWaiting = 10;

// Constructor function
function PlayHandler(app) {
    this.app = app;
};

// Get the Player Action
var PlayerAction = require('./room').PlayerAction;

// Init socket to contact client-server
PlayHandler.prototype.init = function (socket, session, roomsMaster) {
    // Init all the member variables
    logger.info("Init socket");
    var that = this;
    that.socket = socket;
    that.session = session;
    that.userinfo =  {
        id: 1,
        userid: 'test',
        username: 'test'
    };
    socket.playHandler = this;
    that.myroom = null;

    socket.on(MessageTable.FIND_ROOM, function(){
        logger.info(that.userinfo.userid + " Beginning find a room");
        if (that.myroom == null){
            logger.info(" Room for user " + that.userinfo.userid);
            that.myroom = roomsMaster.findRoom(socket, that.userinfo.username, function(){
                that.myroom = null;
            });
            socket.emit(MessageTable.FIND_ROOM, {isgood: true, body: {myroom: that.myroom.iroom}});
        }
        else{
            logger.info("User " + that.userinfo.userid + " has a room " + that.myroom.iroom);
        }
    });

    socket.on(MessageTable.DO_SMTH, function(){
        logger.info(that.userinfo.userid + " Beginning DO_SMTH");

        if (that.myroom != null){
            roomsMaster.rooms[that.myroom.iroom].doSmth(that.myroom.iplayer, "Hello, I'm " + that.userinfo.username);
        }
    });

    socket.on(MessageTable.GET_NAME, function(){
        socket.emit(MessageTable.GET_NAME, {isgood: true, body: that.userinfo});
    });
//
//
//    socket.on(MessageTable.DEAL_CARD, function(sData){
//        if (that.myroom != null){
//            roomsMaster.rooms[that.myroom.iroom].doAction(that.myroom.iplayer, PlayerAction.DealCard, sData);
//        }
//    });
//
//    socket.on(MessageTable.GET_CARD, function(sData){
//        if (that.myroom != null){
//            roomsMaster.rooms[that.myroom.iroom].doAction(that.myroom.iplayer, PlayerAction.GetCards, null,
//            function(cardsData){
//                socket.emit(MessageTable.GET_CARD, {isgood: true, body: cardsData});
//            });
//        }
//    });
//
//    socket.on(MessageTable.EXCHANGE_CARD, function(sData){
//        if (that.myroom != null){
//            roomsMaster.rooms[that.myroom.iroom].doAction(that.myroom.iplayer, PlayerAction.Exchange, sData);
//        }
//    });
};

// Socket on listen dealing card
PlayHandler.prototype.onDealingCard = function(callback){
    var me = this;
    var fnDealingCard = function(sData){
        logger.info("Received cards");
        logger.info(sData.cards);
        if (me.myroom != null){
            callback(sData.cards);
        }
        if (me.socket.iwaitting){
            logger.info("Clear time out " + sData.cards);
            clearTimeout(me.socket.iwaitting);
            me.socket.iwaitting = null;
        }
        me.socket.removeListener(MessageTable.DEAL_CARD, fnDealingCard);
    };

    this.socket.iwaitting = setTimeout(function(){
        // Over 20 seconds to think
        logger.info("Pass tour")
        callback([]);
        me.socket.removeListener(MessageTable.DEAL_CARD, fnDealingCard);
        me.socket.iwaitting = null;
    }, TimeWaiting*1000);

    me.socket.on(MessageTable.DEAL_CARD, fnDealingCard);
}

// Socket received game state
PlayHandler.prototype.getGameStatus = function(data, callback){
    var me = this;
    me.socket.emit(MessageTable.GAME_STATUS, {isgood: true, body: data});
}

// Get my cards
PlayHandler.prototype.getCards = function(data){
    this.socket.emit(MessageTable.GET_CARD, {isgood: true, body: data});
}

// Get my solutions for beginning play
PlayHandler.prototype.getSolutions = function(data){
    var me = this;
    me.socket.emit(MessageTable.GET_SOLUTION, {isgood: true, body: data});
}

// Get my result
PlayHandler.prototype.getResult = function(data){
    var me = this;
    me.myroom = null;
    me.socket.emit(MessageTable.GET_RESULT, {isgood: true, body: data});
}

/*
*   @constructor
*   Create an instance of Play Handler
*   @param {node application} app
 */
module.exports = function(app){
    return new PlayHandler(app);
};
