// Create the player manager model
var log4js = require('log4js'),
    logger = log4js.getLogger('PlayerModel'),
    utils = require("../../common/utils");

/**
 * Construct new player object
 */
function Player(dbHelper, userName, userId, lastlogin, callback) {
    this.dbHelper = dbHelper;
    this.lastlogin = lastlogin;
    this.username = userName;
    this.userid = userId;

    // Get player info from db
    this.getPlayerInfo(callback);
}

/**
 * Get player info from db If player does not exist, then create new player
 */
Player.prototype.getPlayerInfo = function (callback) {
    logger.trace("Begin get player info from player table");
    var that = this;
    // Init
    var tables = [ "player" ];
    var conditions = [ "userid ='" + that.userid + "'" ];
    that.dbHelper.get(function (err, res) {
        if (err) {
            logger.error(err);
        } else if (res.rows.length == 0) {
            logger.trace("Player doesn't exist, create new one");
            that.createNewPlayer(callback);
        } else if (callback) {
            logger.trace("Player exist, continue play game");
            callback(res.rows[0]);
        }
    }, tables, conditions, null, null);
};

/**
 * Create new player and add to db
 */
Player.prototype.createNewPlayer = function (callback) {
    logger.trace("Begin create new player for player table");
    var that = this;
    // Init
    var tables = [ "player2" ];
    var insert = {
        "username": that.username,
        "userid": that.userid,
        "lastlogin": that.lastlogin
    };
    that.dbHelper.insert(function (err, res) {
        if (err) {
            logger.error(err);
            if (callback) {
                callback(false);
            }
        } else if (callback) {
            logger.trace("Finish create new player for player table: " + that.userid);
            callback({isgood: true, info: {
                "username": that.username,
                "userid": that.userid,
                "lastlogin": that.lastlogin
            }});
        }
    }, tables, insert);
};


///**
// * Get highest score
// */
Player.prototype.getHighestScore = function (callback) {
    var that = this;
    logger.trace("getHighestScore to user " + that.userid + " - " + that.username);
    var tables = [ "player" ];
    var conditions = [ "userid ='" + that.userid + "'" ];
    that.dbHelper.get(function (err, res) {
        if (err) {
            logger.error(err);
        } else if (res.rows.length == 0) {
            callback(0);
        } else if (callback) {
            logger.trace("getHighestScore " + res.rows[0].fscore);
            callback(res.rows[0].fscore);
        }
    }, tables, conditions, ['fscore'], null);
};

/**
 * Constructor of PlayerManager class
 */
function PlayerManager(dbHelper) {
    this.dbHelper = dbHelper;
}

/**
 * Create or get a player with given id, name from db
 */
PlayerManager.prototype.create = function (id, userName, userId,lastlogin, callback) {
    // Create new player
    return new Player(this.dbHelper, id, userName, userId,lastlogin, callback);
};

module.exports = function (dbHelper) {
    return new PlayerManager(dbHelper);
};

