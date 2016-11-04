var log4js = require('log4js');
var logger = log4js.getLogger('MainModel');

module.exports = function(app, callback) {
    logger.trace("Enter loading main models.");

    // init db helper
    var db = app.dbConfig;
    app.dbHelper = require("../../common/models/dbhelper")(db.url, db.dbName, db.login, db.password);

    // TODO: init all models
    // Init all others model data
    app.models = {};
    app.models.playerManager = require("./playermodel")(app.dbHelper);
    app.models.entryManager = require("./entrymodel")(app.dbHelper);
    app.models.tournamentManager = require("./tournamentmodel")(app.dbHelper);

    if (callback) {
        callback();
    }

    logger.trace("Exit loading main models.");
};