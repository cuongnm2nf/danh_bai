// common configuration
module.exports = function (app, express, sessionSecret) {
    // all game port
    app.GAME_PORT = {
        DAIFUGO: 5000,
        CARDSPEED: 5001,
		MAHJONG: 5002
    };

    // redisStore which stores the session
    var RedisStore = require('connect-redis')(express);
    app.sessionStore = new RedisStore({
        host: "localhost",
        port: 6379,
        db: 2
    });

    // var MemoryStore = express.session.MemoryStore;
    // app.sessionStore = new MemoryStore();
    // app.sessionStore.clear();
    //app.sessionSecret = "48C31843B34EB233D1FC88B7CEC8B";
    app.sessionSecret = sessionSecret;
    app.sessionKey = "sid";
    app.sessionMaxAge = 30 * 60 * 1000; // 30 minutes

    app.configure(function () {
        //app.set('port', process.env.PORT || PORT);
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        //app.use(express.cookieParser("48C31843B34EB233D1FC88B7CEC8B"));
        app.use(express.cookieParser(sessionSecret));
        app.use(express.session({
            store: app.sessionStore,
            secret: app.sessionSecret,
            cookie: {
                httpOnly: false,
                maxAge: app.sessionMaxAge
            },
            key: app.sessionKey
        }));
        app.use(app.router);

        // public client folder
        app.use(express.static(__dirname + '/public/', {
            maxAge: 1 * 60 * 60 * 1
        })); // 1 hour
    });

    app.configure('development', function () {
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
    });
};