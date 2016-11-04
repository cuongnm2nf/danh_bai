/*
        Create a Room-mater
        - Control room: create new room, add player to a room, display room information
 */
module.export = function(){
    return new Room();
};

/*************************
 *
 *  @constructor
 *  Create a new room
 *
 *************************/
function Room(){
    this.mPlayers = [];
};

/*
*
*   @function
*   Add a new player
*   @param {Player} player
 */
Room.prototype.addPlayer = function(player){
    this.mPlayers.push(player);
};

Room.prototype.getNBPlayers = function(){
    return this.mPlayers.length;
};
