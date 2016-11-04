// Create the entry manager model
var log4js = require('log4js'),
    logger = log4js.getLogger('EntryModel'),
    utils = require("../../common/utils"),
    constances = require("../constants.js")();

// Export to EntryManager Class
module.exports = function (dbHelper) {
    return new EntryManager(dbHelper);
};

/**
 * Constructor of EntryManager class
 */
function EntryManager(dbHelper) {
    this.dbHelper = dbHelper;
}

/**
 * Create or get a Entry with given userid, time to create
 */
EntryManager.prototype.create = function (userid, tourid, playid, type, callback) {
    // TODO: create entryid based on tourname
    var cdate = new Date();
    var entryid = userid + "_" + cdate.getFullYear() + cdate.getMonth() + cdate.getDate()
                    + "_" + cdate.getHours() + cdate.getMinutes() + cdate.getSeconds() + cdate.getMilliseconds();
    logger.trace("Begin create new entry for player " + userid + " with entryid " + entryid);
    var that = this;
    // Init
    var tables = [ "entry" ];
    var insert = {
        "entryid": entryid,
        "userid": userid,
        "maxstage": 1,
        "playid": playid
    };
    if (tourid){
        insert.tourid = tourid;
    }
    if (type){
        insert.type = type;
    }
    that.dbHelper.insert(function (err, res) {
        if (err) {
            logger.error(err);
            if (callback) {
                callback({
                    isgood: false,
                    info: err
                });
            }
        } else if (callback) {
            logger.trace("Finish create new entry for player " + userid + " with entryid " + entryid);
            callback({
                isgood: true,
                info: entryid
            });
        }
    }, tables, insert);
};

/**
 * Update Score and Stage to entry
 */
EntryManager.prototype.updateScore = function (entryid, score, maxstage, callback) {
    logger.trace("Begin update score with entryid " + entryid);
    var that = this;
    var querry = "UPDATE entry SET score = score + " + score + " , maxstage = " + maxstage + " WHERE entryid = '" + entryid + "'"
    that.dbHelper.exec(
        querry,
        function (err, res) {
        if (err) {
            logger.error(err);
            if (callback) {
                callback({
                    isgood: false,
                    info: err
                });
            }
        } else if (callback) {
            logger.trace("Finish update score with entryid " + entryid);
            callback({
                isgood: true,
                info: null
            });
        }
    });
};

/**
 * Get entry following date
 */
EntryManager.prototype.getByDate = function (date, callback) {
    logger.trace("Begin get entry by date " + date);
    var that = this;
    var querry = "Select * From entry Where entry.on_date::date = '" + date + "'";
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback({
                        isgood: false,
                        info: err
                    });
                }
            } else if (callback) {
                logger.trace("Ending get entry by date " + date);
                callback({
                    isgood: true,
                    info: res.rows
                });
            }
        });
};

/**
 *
 *
 *  Get entry following all ranking mode
 *
 *  @param date: date to get ranking
 *  @param from: beginning position of the ranking list to get
 *  @param to: ending position of the ranking list to get
 *  @param callback: function callback when finish to get ranking list
 */
EntryManager.prototype.getAllRanking = function (date, from, to, callback) {
    logger.trace("Begin get getAllRanking by date " + date);
    var that = this;
    var querry = "Select * From player, entry, tournament Where player.userid = entry.userid and entry.tourid = tournament.tourid and tournament.date = '" + date + "'"  +
        " and entry.type = " + constances.entryInfo.Normal +
                " Order By rank ASC, prize DESC, score DESC, entry.id ASC Offset " + from + " Limit " + (to - from );
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending get getAllRanking by date " + date);
                callback(
                    true,
                    res.rows
                );
            }
        });
};

/**
 *
 *
 *  Get entry following my ranking mode
 *
 *  @param date: date to get ranking
 *  @param userid: userid to get ranking
 *  @param from: beginning position of the ranking list to get
 *  @param to: ending position of the ranking list to get
 *  @param callback: function callback when finish to get ranking list
 */
EntryManager.prototype.getMyRanking = function (date, userid, from, to, callback) {
    logger.trace("Begin get getMyRanking by date " + date);
    var that = this;
    var querry = "Select * From player, entry, tournament Where player.userid = entry.userid and entry.tourid = tournament.tourid and tournament.date = '" + date + "'" +
        " and entry.userid = '" + userid + "' " + " and entry.type = " + constances.entryInfo.Normal +
        " Order By rank ASC, prize DESC, score DESC, entry.id ASC Offset " + from + " Limit " + (to - from);
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending get getMyRanking by date " + date);
                callback(
                    true,
                    res.rows
                );
            }
        });
};

/**
 *
 *
 *  Get all date of user's ranking
 *
 *  @param date: date to get ranking
 *  @param userid: userid to get ranking
 *  @param from: beginning position of the ranking list to get
 *  @param to: ending position of the ranking list to get
 *  @param callback: function callback when finish to get ranking list
 */
EntryManager.prototype.getDateRanking = function (userid, callback) {
    logger.trace("Begin get getDateRanking by date " + userid);
    var that = this;
    var querry = "Select DISTINCT tournament.date as tourdate From entry, tournament Where entry.userid = '" +
        userid + "' and tournament.tourid = entry.tourid" + " and entry.type = " + constances.entryInfo.Normal + " Order By tournament.date DESC ";
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending get getDateRanking by date " + userid);
                callback(
                    true,
                    res.rows
                );
            }
        });
};

/**
 *
 *
 *  Get all date of user's tournament
 *
 *  @param {Date} date: date to get ranking
 *  @param {text} userid: userid to get ranking
 *  @param {function} callback: function callback when finish to get ranking list
 */
EntryManager.prototype.getTourRanking = function (userid, date, callback) {
    logger.trace("Begin get getTourRanking by date " + userid);
    var that = this;
    var querry = "Select DISTINCT tournament.tourid as tourid, starttime, endtime From entry, tournament Where entry.userid = '" +
        userid + "' and tournament.tourid = entry.tourid" + " and entry.type = " + constances.entryInfo.Normal
        + " and tournament.date = '" + date + "'" +" Order By tournament.date DESC ";
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending get getTourRanking by date " + userid);
                callback(
                    true,
                    res.rows
                );
            }
        });
};

/**
 * Get normal entry following rule and Date
 * @param date: date of rules
 * @param rules: Rule's array
 * @param callback: next processing callback
 */
EntryManager.prototype.getByRule = function (date, start_time, end_time, from_point, to_point, bonus, callback) {
    logger.trace("Begin get entry by date " + date);
    var that = this;
    var querry = "Select entryid, player.userid, score, tournament.tourid, playid From entry, player, tournament "
    + "Where player.userid = entry.userid and entry.tourid = tournament.tourid and tournament.date = " + "'" + date + "'" + " and tournament.starttime = "
    + "'" + start_time.substr(0, 5) + "' "
    + " and entry.type = " + constances.entryInfo.Normal
    + " and (player.fscore + player.sscore + player.tscore) between 3*" + from_point + " and 3*" + to_point + " "
    + "Order by entry.score DESC, entry.on_date ASC";
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending get entry by rule " + date);
                callback(
                    true,
                    {playList: res.rows, bonus: bonus}
                );
            }
        });
};

/**
 * Update entry prize, level, ranking
 * @param date: date of rules
 * @param rules: Rule's array
 * @param callback: next processing callback
 */
EntryManager.prototype.updateRanking = function (entryid, prize, level, rank, callback) {
    logger.trace("Begin update ranking entry " + entryid);
    var that = this;
    var querry = "Update entry Set prize = " + prize + " , level = '"
        + level + "', rank = " + rank + " Where entryid = '" + entryid + "'";
    that.dbHelper.exec(
        querry,
        function (err, res) {
            if (err) {
                logger.error(err);
                if (callback) {
                    callback(
                        false,
                        err
                    );
                }
            } else if (callback) {
                logger.trace("Ending update ranking entry " + entryid);
                callback(
                    true,
                    null
                );
            }
        });
};


