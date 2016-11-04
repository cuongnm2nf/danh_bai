var log4js = require('log4js'),
    logger = log4js.getLogger('Daifugo-Room');
var Room = require('./room.js');

var rooms = [];
var nbPlayers = 4;

module.exports = function(server, app) {
    this.currentRoom = null;
    var that = this;

    // Find a room
    app.post("/findroom", function (req, res) {
        logger.info("find a room");
        if (rooms.length == 0 || (that.currentRoom && that.currentRoom.getNBPlayers() > nbPlayers)){
            var room = new Room();
            that.currentRoom = room;
            rooms.push(room);
        }
    });

    // Do some thing
    app.post("/dosmth", function(req, res){
        logger.info("Do some thing");
    });
};

try{
    io = io.listen(server);

    io.sockets.on("connection", function(socket) {
        console.log("Init connection");
    });
}catch(e){
    console.log("Exception " + e);
}

