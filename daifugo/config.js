var constants = require('./constants')();
var log4js = require('log4js');
var logger = log4js.getLogger('Config');

module.exports = function(app, express) {
    logger.trace("Enter loading configuration.");

    app.dbConfig = {
        url: "localhost:5432",
        dbName: "cardgame_daifugo",
        login: "postgres",
        password: "postgres"
        //password: "123456"
    };

    // load common configuration
    require("../config")(app, express, constants.SESSION_SECRET);

    logger.trace("Exit loading configuration");
};