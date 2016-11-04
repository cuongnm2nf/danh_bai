/**
 * Created with JetBrains WebStorm.
 * User: thinhnd
 * Date: 5/20/14
 * Time: 6:45 PM
 * To change this template use File | Settings | File Templates.
 */
//********************************************************************
//
//  Module pattern processing all the request with a attended time
//      - fflow = function(packet, flowfunction): 2 variables
//                  User's function to transfer the request packet
//                  When it finish, the flowfunction will be called
//                      + put it when your process with the packet finish
//      - ecallback: Function will be called on the ending flow
//      - timerequest [optional]: time to check the ending of fflow
//                  1 second by default
//
//  Example:
//*********************************************************************

module.exports = function(fflow, ecallback, timerequest) {
    return new FlowCallback(fflow, ecallback, timerequest);
};

function FlowCallback(fflow, ecallback, timerequest){
    // Function to execute each packet
    this.flow = fflow;
    this.ecallback = ecallback;
    if (timerequest){
        this.timerequest = timerequest;
    }
    else{
        this.timerequest = 1*1000;
    }
    this.qpackets = [];

    var that = this;
    this.exec = function(){
        var rFlag = true;
        var ivtSendPacket = setInterval(function(){
            if (rFlag){
                if (that.qpackets.length > 0){
                    var packet = that.qpackets.pop();
                    rFlag = false;
                    fflow(packet, function(){
                        rFlag = true;
                    });
                }
                else{
                    that.ecallback();
                    clearInterval(ivtSendPacket);
                }
            }
        }, that.timerequest);
    }

    this.push = function(packet){
        that.qpackets.push(packet);
    }
};
