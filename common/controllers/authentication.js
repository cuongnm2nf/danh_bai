var
everyauth = require("everyauth"),
Platform = require("./pfapi"),
constants = require('../constants')(),
log4js = require('log4js'),
logger = log4js.getLogger('common.authentication'),
URL = require('url')
;

everyauth.open = require("../everyauth/open");
everyauth.open.everyauth = everyauth;
everyauth.modules.open = everyauth.open;
if (everyauth.open.shouldSetup) {
    everyauth.enabled.open = everyauth.open;
}

module.exports = function (app, info) {
    logger.trace("Init authentication");

    // prevent timeout error when connecting to platform
    everyauth.everymodule.moduleTimeout(-1);

    everyauth.everymodule.findUserById(function (req, userId, callback) {
        logger.trace('enter findUserById');
        var user = req.session.auth.user;
        if (user) {
            callback(null, user);
        } else {
            callback(["Login error"], null);
        }
    });

    /*everyauth
        .password
        .getLoginPath("/login.html")
        .postLoginPath("/login")
        .displayLogin(function (req, res, next) {
            console.log("Display login page");
            var auth = req.session.auth || {};

            // update 607 login screen for each game
            if (redirectLink === '/sc') {
                res.render("sc/login.jade", {
                    "login": auth.login,
                    "errors": auth.errors
                });
            } else if (redirectLink === '/br') {
                res.render("br/login.jade", {
                    "login": auth.login,
                    "errors": auth.errors
                });
            }
        })
        .authenticate(function (login, password, req, res) {
            var promise = this.Promise();
            //authentication(login, password, gameid, req, res, promise);
            authentication(app, login, password, req, res, promise);

            return promise;
        })
        .addToSession(function (session, user, errors) {
            delete session.auth;
            var auth = session.auth = {};
            if (user) {
                console.log("Added to session: " + user.username);
                auth.user = user;
            }
            auth.loggedIn = !!user;
        })
        .respondToLoginFail(function (req, res, errors, login) {
            if (errors && errors.length > 0) {
                console.log("Login fail: " + errors + " " + login);
                req.session.auth.errors = errors;
                req.session.auth.login = login;
                res.redirect("/login.html#errors");
            }
        })
        .respondToLoginSucceed(function (res, user) {
            if (user) {
                console.log("Login success");
                res.redirect(redirectLink);
            }
        })
        .getRegisterPath('/register')
        .postRegisterPath('/register')
        .registerView('register.jade')
        .registerLocals(function (req, res, done) {
            setTimeout(function () {
                done(null, {
                    title: 'Async Register'
                });
            }, 200);
        })
        .validateRegistration(function (newUserAttrs, errors) {
            var login = newUserAttrs.login;
            if (usersByLogin[login]) errors.push('Login already taken');
            return errors;
        })
        .registerUser(function (newUserAttrs) {
            var login = newUserAttrs[this.loginKey()];
            return usersByLogin[login] = addUser(newUserAttrs);
        })
        .registerSuccessRedirect('/');*/

    everyauth
	.open
        .step('findOrCreateUser')
        .accepts('res session accessToken extra oauthUser')
        .promises('user')
        .step('sendResponse')
        .accepts('res user')
        .promises(null)
	.appId(app.platformInfo.client_id)
	.appSecret(app.platformInfo.client_secret)
        .myHostname(info.hostName)// If test on local --> remove this line
	.handleAuthCallbackError( function (req, res) {
            logger.trace('enter handleAuthCallbackError');
	    res.header('Content-Type', 'text/html');
	    res.write('<script>');
            res.write('window.location="' + constants.OPEN_URL.AUTH_BASIC + '";');
	    res.end('</script>');
	})
        .myModuleErrback( function (err, seqValues) {
            logger.trace('enter myModuleErrback');
            var res = seqValues.res;
	    res.header('Content-Type', 'text/html');
	    res.write('<script>');
	    res.write('alert("Login failed.Please try again later.");');
	    res.end('</script>');
        })
	.findOrCreateUser( function (res, sess, accessToken, extra, openUser) {
            logger.trace('enter findOrCreateUser');
            var user = {
                id: openUser.profile.id,
                userid: openUser.profile.user_id,
                username: openUser.profile.nick_name,
                language: openUser.profile.language,
                accesstoken: accessToken,
                refreshtoken: extra.refresh_token
            };
	    logger.trace(user);
	    return user;
	})
	.addToSession( function (session, user) {
            logger.trace('enter addToSession');
            delete session.auth;
            session.auth = {};
            if (user && user.user) {
		logger.info("Added to session: " + user.user.username);
                session.auth.user = user.user;
            }
            session.auth.loggedIn = !!user.user;
	    session.accesstoken = user.user.accesstoken;
	    session.refreshtoken = user.user.refreshtoken;
	    logger.trace(session);
	})
	.sendResponse( function (res, user) {
            logger.trace('enter sendResponse');
	    res.header('Content-Type', 'text/html');
	    res.write('<script>');
	    res.write('window.location="' + info.redirectURL + '";');
	    res.end('</script>');
	});

    return everyauth;
};
