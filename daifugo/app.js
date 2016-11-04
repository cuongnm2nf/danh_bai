var express = require('express'),
    app = module.exports = express(),
    http = require("http"),
    constants = require("./constants")();

app.log4js = require('log4js');
app.log4js.configure('daifugo/log4js.json');
app.logger = app.log4js.getLogger();

app.platformInfo = constants.platformInfo;

// authentication
//app.everyauth = require("../common/controllers/authentication")(app, constants.gameInfo);

// init configuration
require("./config")(app, express);

// create server
var server = http.createServer(app);
server.listen(app.GAME_PORT.DAIFUGO, function() {
    app.logger.trace("[app][Daifugo] Server is running on port " + app.GAME_PORT.DAIFUGO);
});

// init main controller
require("./controllers/main")(app, server);

// load router
require("../common/routes")(app);

app.logger.trace("[app] Server finish initializing and ready.");

