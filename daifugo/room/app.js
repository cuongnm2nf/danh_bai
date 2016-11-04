var express = require('express')
app = module.exports = express(),
http = require("http");

var PORT = 5010;

app.configure(function(){
    app.set('port', process.env.PORT || PORT);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(app.router);

    // public client folder
    app.use(express.static(__dirname + '/public', {maxAge: 1 * 60 * 60 * 1}));  // 1 hour
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions : true,
        showStack : true
    }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// create server
var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Room server listening on port ' + app.get('port'));
});

var io = require("socket.io");

// init controller
require("./controller")();

