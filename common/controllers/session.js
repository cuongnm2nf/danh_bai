var Session = require('express/node_modules/connect').middleware.session.Session;

Session.prototype.set = function(key, value, callback) {
    if (key !== undefined) {
        console.log("Set " + key + " = " + value);
        this[key] = value;
        this.save(callback);
    }
};

Session.prototype.remove = function(key, callback) {
    if (key !== undefined) {
        delete this[key];
        this.save(callback);
    }
};

module.exports = Session;
