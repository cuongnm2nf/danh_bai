var log4js = require('log4js');
var logger = log4js.getLogger('MainController');

module.exports = function(app, server) {
    logger.trace("Enter loading main controller.");

    // load models
    require("../models/main")(app, function() {
        // init start game handlers
        require("./connect")(server, app);
//        require("./AIcore/Dfggame")(server, app);
        logger.trace("Exit loading main controller.");
    });
};