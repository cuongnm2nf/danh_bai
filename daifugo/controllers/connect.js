var cookie = require("cookie"),
    Session = require("../../common/controllers/session"),
    connectUtils = require('express/node_modules/connect/lib/utils'),
    io = require("socket.io"),
    utils = require("../../common/utils"),
    log4js = require('log4js'),
    logger = log4js.getLogger('ConnectHandler'),
    constants = require("../constants")();

var RoomDfg = require("./room");
var roomsMaster = RoomDfg.roomsMaster;

function ConnectHandler(server, app) {
    logger.trace("Enter loading connect handler");

    try {
        // listen on the given server
        io = io.listen(server);

        // configuration for socket.io
        io.configure(function() {
            io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
            io.set('polling duration', 30);
            io.set('close timeout', 60);
        });

        // configuration for development
        io.configure('production', function() {
            io.set('log level', 0);
        });

        //TODO: Get model objects
// Get model objects
        var playerManager = app.models.playerManager,
            entryManager = app.models.entryManager,
            tournamentManager = app.models.tournamentManager;

        var that = this;

        // authorize connection
        io.set('authorization', function(data, accept) {
            that.authorizeConnection(app, data, accept);
        });

        // hanlde new connection
        io.sockets.on("connection", function(socket) {
            logger.trace("[connection] A socket " + socket.id + " with session ID " + socket.handshake.sessionID + " connected !");

            // Check number of connection disconnect
            for (var client in io.sockets.clients()) {
                logger.trace("[connection] " + io.sockets.clients()[client].id + " disconnected: " + io.sockets.clients()[client].disconnected);
            }
            // create game handler objects
            var playGameHandler = require("./playgame")(app);
            // get session
            var session = socket.handshake.session;
          //  debugger;
            var timelogin = session.req.time.toString();
            var lastlogin = timelogin;
            // get user
            var user = {
                id: 1,
                userid: 'test',
                username: 'test'
            };
            var userName = user.username;
            var userId = user.userid;
            // creat Player on database
            var player = playerManager.create(userName,userId, lastlogin);
            player.createNewPlayer();
            for(var x in user){
                logger.info(x + ":" + user[x])
            }

            // renew session
            that.renewSession(socket, session, app.sessionKey, app.sessionMaxAge);

            // setup an inteval that will keep our session fresh
            socket.sessionIntervalID = setInterval(function () {
                that.renewSession(socket, session, app.sessionKey, app.sessionMaxAge);
            }, app.sessionMaxAge - 60 * 1000);

            // Init the play game handle with room master
            playGameHandler.init(socket, session, roomsMaster);

            // on disconnect handler
            socket.on("disconnect", function() {
                try {
                    logger.trace("[disconnect] Disconnect network occurs !!!");

                    // clear refreshing session interval function, if any
                    if (socket.sessionIntervalID) {
                        clearInterval(socket.sessionIntervalID);
                    }

                    // Delete the room
                    if (socket.playHandler && socket.playHandler.myroom){
                        roomsMaster.deleteRoom(socket.playHandler.myroom.id)
                    }

                    // delete socket data
                    for (var key in socket) {
                        delete socket[key];
                    }

                    logger.trace("[Disconnect] Complete clear all socket data");
                } catch(e) {
                    logger.error("[Disconnect] Exception in disconnect: " + e);
                }
            });
        });
    } catch(e) {
        logger.error("Exception in start game handler: " + e);
    }
};

/**
 * Perform authorization on a new connection
 */
ConnectHandler.prototype.authorizeConnection = function(app, data, accept) {
    if (!data.headers.cookie) {
        logger.error("[authorizeConnection] Get cookie failed !");
        accept("Login required", false);
        return;
    }

    var signedCookie = cookie.parse(data.headers.cookie);
    data.cookie = connectUtils.parseSignedCookies(signedCookie, app.sessionSecret);

    data.sessionID = data.cookie[app.sessionKey];
    data.sessionStore = app.sessionStore;
    logger.trace("[authorizeConnection] sessionID = " + data.sessionID);

    data.sessionStore.get(data.sessionID, function (err, session) {
        /*if (err || !session || !session.auth || !session.auth.loggedIn) {
         logger.error("[authorizeConnection] Grab session failed !");
         // if we cannot grab a session, turn down the connection
         accept("Login required", false);
         } else {*/  // TODO-GameCard
        // save the session data and accept the connection
        data.session = new Session(data, session);
        accept(null, true);
        //} // TODO-GameCard
    });
};

/**
 * Renew session
 */
ConnectHandler.prototype.renewSession = function (socket, session, sessionKey, sessionMaxAge) {
    try {
        // "touch" it (resetting maxAge and lastAccess)
        // and save it back again.
        session.touch().save();
        logger.trace("[renewSession] Renew session: " + sessionKey + " "
            + session.id + " " + sessionMaxAge);
        // update cookie expiration on client
        socket.emit("updateCookie", sessionKey, new Date(Date.now() + sessionMaxAge));
    }
    catch (err) {
        logger.error("[renewSession] Exception when renew session: " + err);
    }
};

module.exports = function(server, app) {
    return new ConnectHandler(server, app);
};