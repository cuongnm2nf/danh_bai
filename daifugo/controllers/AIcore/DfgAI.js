var aiutils = require('./aiutils');

/*
*
*   AI for CPU
*   @function
*   @param {Array[Cards]} mySolutions: set of solutions
*   @param {Integer} myLevel: Level of AI
*
* */
module.exports.findSolution = function(mySolutions, myLevel, myCards, otherCards, curTour, prevTours){
    var ret = [];
    if (mySolutions.length > 0){
        ret = mySolutions[0];
        for(var i = 1; i < mySolutions.length; i++){
            if ((mySolutions[i].length > ret.length && mySolutions[i][0].mRank <= ret[0].mRank + 3)
                || aiutils.cardsCompare(mySolutions[i], ret) < 0){
                ret = mySolutions[i];
            }
        }
    }
    return ret;
}