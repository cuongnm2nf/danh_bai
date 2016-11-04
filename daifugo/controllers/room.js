var log4js = require('log4js');
var Dfggame = require("./AIcore/Dfggame");
var DfgRule = require("./AIcore/DfgRule");
var log4js = require('log4js'),
    logger = log4js.getLogger('RoomMaster');

var nbPlayerRoom = 4;
var cpuTime = 1;
var beginTime = 3;

/*
 *
 *       Room master to room distribution, send message for socket's player
 *
 * */
var PlayerAction = {
    DealCard: 0,
    Pass: 1,
    GetCards: 2,
    Exchange: 4
};

var PlayerTypeManager = {
    CPU: function (iplayer, level, game) {
        this.type = Dfggame.PlayerType.CPU;
        this.level = level;
        this.name = 'CPU ' + iplayer;
        this.game = game;
        this.solutions = [];
        this.iplayer = iplayer;
        this.timeOut = null;

        this.dealCard = function (callback) {
            // TODO: AI implement at here
            var solution = [];
            solution = game.mPlayers[iplayer].findSolution();
            var me = this;
            this.timeOut = setTimeout(function () {
                me.timeOut = null;
                callback(solution);
            }, cpuTime * 1000);
        }

        this.getSolution = function (data) {
            this.soluton = data;
        }
    },
    HUM: function (iplayer, socket, username, ecallback) {
        this.type = Dfggame.PlayerType.Human;
        this.socket = socket;
        this.name = username;
        this.ecallback = ecallback;
        this.iplayer = iplayer;

        this.dealCard = function (callback) {
            if (socket.playHandler){
                socket.playHandler.onDealingCard(function (data) {
                    callback(data);
                });
            }
        }
        this.getSolution = function (data) {
            this.solution = data;
        }
    }
}

var roomsMaster = {
    rooms: [],
    findRoom: function (socket, username, ecallback) {
        var iroom = null;
        if (this.rooms.length != 0) {
            for (var i = 0; i < this.rooms.length; i++) {
                if (this.rooms[i]== null || this.rooms[i].getSize() < nbPlayerRoom) {
                    iroom = i;
                    break;
                }
            }
        }

        if (iroom === null) {
            // Create a new room
            iroom = this.createRoom(this.rooms.length);
        }
        else{
            // Re-use this room
            if (this.rooms[iroom] == null){
                this.createRoom(iroom);
            }
        }

        var iplayer = this.rooms[iroom].addPlayer(new PlayerTypeManager.HUM(null, socket, username, ecallback));
        if (this.rooms[iroom].getSize() == nbPlayerRoom) {
            this.rooms[iroom].init();
        }
        return {iroom: iroom, iplayer: iplayer};
    },
    createRoom: function (index) {
        var roomlogger = log4js.getLogger('room ' + index);
        var room = {
            id: index,
            mPlayers: [],
            mTurn: 0,
            mGameCard: new Dfggame.GameCard(),
            mGameRule: new DfgRule.GameRule(),
            //addPlayer: function(socket, name, endCallback){\
            addPlayer: function (player) {
//                var player = {
//                    socket: socket,
//                    ecallback: endCallback,
//                    name: name
//                }
                this.mPlayers.push(player);
                player.iplayer = this.mPlayers.length - 1;
                this.mGameCard.addPlayer(player.type, player.level);
                return this.mPlayers.length - 1;
            },
            sendMessage: function (message) {
                for (var i = 0; i < this.mPlayers.length; i++) {
                    if (this.mPlayers[i].type == Dfggame.PlayerType.Human) {
                        this.mPlayers[i].socket.emit("ROOM_TALK", message);
                    }
                }
            },
            getSize: function () {
                return this.mPlayers.length;
            },
            removePlayers: function () {
                delete this.mPlayers;
                this.mPlayers = [];
            },
            doSmth: function (iplayer, message) {
                logger.info("The player " + this.mPlayers[iplayer].name + " do smth");
                if (iplayer == this.mTurn % nbPlayerRoom) {
                    this.sendMessage("Players " + this.mPlayers[iplayer].name + " talk " + message);
                    this.mTurn++;
                }
                else {
                    this.mPlayers[iplayer].socket.emit("DO_SMTH", {isgood: true, body: "You can not do it"});
                }
            },
            // Make an action from player
            doAction: function (iplayer, action, data, callback) {
                var actionStatus = null;
                switch (action) {
                    case PlayerAction.DealCard:
                        if (!this.mGameCard.verifyTurn(iplayer)) {
                            return;
                        }
                        roomlogger.info('Player ' + this.mPlayers[iplayer].name + ' Deal Card');
                        roomlogger.info(data);
                        actionStatus = this.mGameCard.playerDecideCards(data);
                        if (data.length == 0) {
                            action = PlayerAction.Pass;
                        }
                        break;
                    case PlayerAction.GetCards:
                        roomlogger.info('Player ' + this.mPlayers[iplayer].name + ' GET Card');
                        var cardsData = this.mGameCard.getMyCards(iplayer);
                        if (callback) {
                            callback(cardsData);
                        }
                        break;
                    case PlayerAction.Pass:
                        if (this.mGameCard.verifyTurn(iplayer)) {
                            return;
                        }
                        roomlogger.info('Player ' + this.mPlayers[iplayer].name + ' Pass');
                        roomlogger.info(data);
                        actionStatus = this.mGameCard.playerDecideCards(data);
                        break;
                    case PlayerAction.Exchange:
                        roomlogger.info('Player ' + this.mPlayers[iplayer].name + ' Exchange');
                        //
                        // this.mGameCard.exchangeUserCard(data);
                        //roomlogger.info(this.mGameRule.getMovingCards(this.mGameCard.getMyCards(1).myCards, 2, 1));
                        roomlogger.info(data);
                        break;
                }
                if (actionStatus != null) {
                    // Send all message
                    for (var i = 0; i < this.mPlayers.length; i++) {
                        if (this.mPlayers[i].type == Dfggame.PlayerType.Human) {
                            if (this.mPlayers[i].socket.playHandler) {
                                this.mPlayers[i].socket.playHandler.getGameStatus({
                                    action: action,
                                    iplayer: iplayer,
                                    me: iplayer == this.mPlayers[i].iplayer,
                                    data: data,
                                    status: actionStatus
                                }, function () {
                                    // Reserve: for confirmation
                                });
                            }
                        }
                    }

                    // TODO: confirm to get all the action at here
                    if (actionStatus.gameFinish != true) {
                        this.beginToPlay(actionStatus.nextPlayer);
                    }
                    else {
                        roomlogger.info("Ending game at room: " + this.id);
                        var result = [];
                        for (var i = 0; i < this.mPlayers.length; i++) {
                            logger.info(this.mPlayers[i].name + ": " + this.mGameCard.mPlayers[i].status);
                            result.push({iplayer: i, rank: this.mGameCard.mPlayers[i].status});
                        }

                        // send game result
                        for (var i = 0; i < this.mPlayers.length; i++) {
                            if (this.mPlayers[i].type == Dfggame.PlayerType.Human) {
                                if (this.mPlayers[i].socket.playHandler) {
                                    this.mPlayers[i].socket.playHandler.getResult({
                                        result: result,
                                        me: i
                                    }, function () {
                                        // Reserve: for confirmation
                                    });
                                }
                            }
                        }
                        roomsMaster.deleteRoom(this.id);
                    }
                }
            },
            // Playing on the current turn
            nextToPlay: function () {
                var me = this;
                var data = [];
                var iplayer = me.mGameCard.currentTourGame.cPlayer.mIndex;
                this.mPlayers[iplayer].dealCard(function (solution) {
                    // Action dealing card at here
//                    roomlogger.info("dealCard: player " + me.mPlayers[iplayer].name + " ");
//                    roomlogger.info(solution);
                    me.doAction(iplayer, PlayerAction.DealCard, solution);
                });
            },
            // Beginning to play
            beginToPlay: function (iPlayer) {
                // TODO: Implement with multi-player, 3 stages to hand-shake
                roomlogger.info("beginToPlay player: " + iPlayer);
                if (this.mPlayers[iPlayer].type == Dfggame.PlayerType.Human) {
                    var solutions = this.mGameCard.getSolutions(iPlayer);
                    // Emit this solution to the current player
                    if (this.mPlayers[iPlayer].socket.playHandler){
                        this.mPlayers[iPlayer].socket.playHandler.getSolutions(solutions);
                    }
                }

                // Start to play this turn
                this.nextToPlay();
            },
            init: function () {
                var me = this;
                this.mTurn = 0;
                var s = "";
                for (var i = 0; i < this.mPlayers.length; i++) {
                    s += " " + this.mPlayers[i].name;
                }
                roomlogger.info("The room " + index + " beginning");
                this.sendMessage("Beginning the room with " + s);

                // Card distribution
                this.mGameCard.init();

                // send the message to get card
                for (var i = 0; i < this.mPlayers.length; i++) {
                    if (this.mPlayers[i].type == Dfggame.PlayerType.Human) {
                        var cardsData = this.mGameCard.getMyCards(i);
                        this.mPlayers[i].socket.playHandler.getCards(cardsData);
                    }
                }

                // beginTime after get card to start the play entry
                setTimeout(function () {
                    me.beginToPlay(me.mGameCard.currentTourGame.cPlayer.mIndex);
                }, beginTime * 1000);

                roomlogger.info(this.mGameCard.printCards());
            }
        };
        this.rooms[index] = room;
        room.addPlayer(new PlayerTypeManager.CPU(room.getSize(), 0, room.mGameCard));
        room.addPlayer(new PlayerTypeManager.CPU(room.getSize(), 0, room.mGameCard));
        room.addPlayer(new PlayerTypeManager.CPU(room.getSize(), 0, room.mGameCard));

        return this.rooms.length - 1;
    },
    playerTalk: function (iroom, iplayer) {
        this.rooms[iroom].sendMessage();
    },
    deleteRoom: function (iroom) {
        delete this.rooms[iroom];
        this.rooms[iroom] = null;
    }
};

module.exports = {
    roomsMaster: roomsMaster,
    PlayerAction: PlayerAction
};
