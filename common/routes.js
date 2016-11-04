var
log4js = require('log4js'),
logger = log4js.getLogger('common.route')
;

module.exports = function(app) {
    logger.trace("Init common routing");

    app.get("/login", function(req, res) {
        logger.trace('enter /login');
        var session = req.session;
	    logger.trace(session);
        res.json({
                success: true
            });
        // ThinhND deleted 20141113: Remove the login
//        if (session.auth && session.auth.loggedIn) {
//            logger.info('session already existed');
//            logger.info(session);
//            res.json({
//                success: true
//            });
//        } else {
//            logger.info('login required');
//            res.json({
//                success: false,
//                url: '/auth/open'
//            });
//        }
    });
    app.get("/", function(req, res) {
        logger.trace('enter app root / -> redirect to index.html');
        res.redirect('/index.html');
    });
    app.get("/payment/callback*", function(req, res) {
        logger.trace('enter /payment/callback');
        logger.info('url query:');
        logger.info(req.query);
        logger.info('request payment ok with transaction id: ' + req.query.tran);
	    req.session.payment = {
            tid: req.query.tran
        };

        // for running on server with nginx
        //res.redirect('/index.html');
        // for running on local
	    res.redirect('/daifugo/index.html');
    });
};