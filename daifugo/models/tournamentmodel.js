/*
* 
* 
*           Create and Manager tournaments
* 
* 
* 
* */

// Create the entry manager model
var log4js = require('log4js'),
    logger = log4js.getLogger('TournamentModel'),
    utils = require("../../common/utils");

// Export to Tournament Class
module.exports = function (dbHelper) {
    return new Tournament(dbHelper);
};

/**
 * Constructor of Tournament class
 */
function Tournament(dbHelper) {
    this.dbHelper = dbHelper;
}

/**
 * Create or get a Entry with given userid, time to create
 */
Tournament.prototype.create = function (date, rule, callback) {
    var cdate = new Date(date);
    var tourid = "tournament" + "_" + cdate.getFullYear() + (cdate.getMonth() + 1) + cdate.getDate()
        + "_" + rule.start_time + "_" + rule.end_time;
    logger.trace("Begin create new tournament for player " + date + " starttime " + rule.start_time + " endtime " + rule.end_time);
    var that = this;
    // Init
    var tables = [ "tournament" ];
    var insert = {
        "tourid": tourid,
        "starttime": rule.start_time,
        "endtime": rule.end_time,
        "date": date
    };

    that.dbHelper.insert(function (err, res) {
        if (err) {
            logger.error(err);
            if (callback) {
                callback(
                    false,
                    rule
                );
            }
        } else {
            if (callback) {
                logger.trace("Finish create new tournament for player " + date + " starttime " + rule.start_time + " endtime " + rule.end_time);
                callback(
                    true,
                    rule
                );
            }
        }
    }, tables, insert);
};

/**
 * Get entry following date
 */
Tournament.prototype.getByDate = function (date, callback) {
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
                    info: res[0]
                });
            }
        });
};

/**
 * Get entry following date
 */
Tournament.prototype.get4Entry = function (callback) {
    logger.trace("Begin get get4Entry by datetime ");
    var that = this;
    var now = (new Date());
    var date = utils.formatDate(now);
    var querry = "Select date, starttime, endtime, tourid From tournament Where  date = '" + date + "' Order by starttime DESC";
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
                logger.trace("Ending get get4Entry by datetime " + date);

                var info = [];
                var index = null;
                var time = now.getHours()+ ":" + now.getMinutes() + ":" + now.getSeconds();
                for(var i = 0; i < res.rows.length; i++){
                    if (res.rows[i].starttime <= time && res.rows[i].endtime >= time){
                        index = i;
                        break;
                    }
                }

                if (index != null){
                    info.push(res.rows[index]);
                }

                callback(
                     true,
                     info
                );
            }
        });
};

/**
 * Get entry following rule and Date
 * @param date: date of rules
 * @param rules: Rule's array
 * @param callback: next processing callback
 */
Tournament.prototype.getByRule = function (date, rule, callback) {
    logger.trace("Begin get entry by date " + date);
    var that = this;
    var querry = "Select entryid, score, userid From entry, player Where entry.on_date::date = '" + date + "'";
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
                    info: res[0]
                });
            }
        });
}; 