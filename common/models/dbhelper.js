var pg = require('pg');
var log4js = require('log4js');
var logger = log4js.getLogger('CommonDbHelper');

function DBHelper(url, dbName, login, password) {
    var db_login_info = login + ":" + password;
    var db_address = url + "/" + dbName;
    var conString = "tcp://" + db_login_info + "@" + db_address;
    logger.trace("Connecting to db: " + conString);
    this.client = new pg.Client(conString);
    this.client.connect();
}

/**
 * Update given columns in a table
 */
DBHelper.prototype.update = function(callback, table, values, conditions) {
    if (!table || getSize(values) == 0) {
        if (callback) callback(null);
        return;
    }
    
    // values
    var query = "UPDATE " + table + " SET ";
    for (var key in values) {
        if (null == values[key] || undefined == values[key]) {
            query += key + " = " + values[key] + ", ";
        }
        else {
            query += key + " = '" + values[key] + "', ";
        }
    }
    query = query.slice(0, -2);
    
    // conditions
    query += this.parseConditions(conditions);
    
    this.exec(query, callback);
}

/**
 * Insert a row with given data into a table
 */
DBHelper.prototype.insert = function(callback, table, values) {
    if (!table || getSize(values) == 0) {
        if (callback) callback(null);
        return;
    }
    
    var query = "INSERT INTO " + table;
    
    // columns' name
    query += " (";
    for (var key in values) {
        query += key + ", ";
    }
    query = query.slice(0, -2);
    query =  query + ") ";
    
    // values
    query += "VALUES (";
    for (var key in values) {
        query += "'" + values[key] + "', ";
    }
    query = query.slice(0, -2) + ")";
    this.exec(query, callback);
}
    
/**
 * Get all rows from a table
 */
DBHelper.prototype.getAll = function(callback, table, orders) {
    if (!table || table.length == 0) {
        if (callback) callback(null);
        return;
    }
    this.get(callback, table, null, null, orders);
};

/**
 * Get a row with given conditions from a table
 */
DBHelper.prototype.get = function(callback, tables, conditions, columns, orders, limit, offset) {
    if (tables === undefined || tables === null || tables.length == 0) {
        if (callback) callback(null);
        return;
    }
    
    var query = "SELECT ";
    
    // selecting columns
    if (columns && columns.length > 0) {
        for (var i = 0; i < columns.length-1; i++) {
            query += columns[i] + ", ";
        }
        query += columns[columns.length-1];
    }else{
        query += "*";
    }
    
    // tables' name
    query += " FROM ";
    if (tables instanceof Array) {
        for (var i = 0; i < tables.length; i++) {
            query += tables[i] + ", ";
        }
        query = query.slice(0, -2); 
    }else{
        query += tables;
    }
    
    // conditions
    query += this.parseConditions(conditions);
    
    // order
    if (orders && orders.length > 0) {
        query += " ORDER BY ";
        for (var i = 0; i < orders.length; i++) {
            query += orders[i] + ", ";
        }
        query = query.slice(0, -2);
    }
    
    // limit
    if (limit) {
        query += " LIMIT " + limit;
    }
    
    // offset
    if (offset) {
        query += " OFFSET " + offset;
    }
    
    // execute the query
    this.exec(query, callback);
};

DBHelper.prototype.parseConditions = function(conditions) {
    var query = "";
    // conditions
    if (conditions && conditions.length > 0) {
        query += " WHERE ";
        var tmp = 0;
        for (var i = 0; i < conditions.length; i++) {
            if (tmp != 0) {
                query += " and ";
            }
            query += conditions[i];
            
            tmp++;
        }
    }
    return query;
};

/**
 * Execute a query
 */
DBHelper.prototype.exec = function(query, callback) {
    logger.trace("[exec] Executing query: " + query);
    try {
        this.client.query(query, function(err, res) {
            logger.trace("[exec] Done executing query: " + query);
            if (callback){
                callback(err, res);
            }
        });        
    } catch(e) {
        logger.error("[exec] Error: " + e);
    }
};

/**
 * Stop connecting to the db
 */
DBHelper.prototype.end = function() {
    this.client.end();  
};

/**
 * Get size of a dictionary.
 */
function getSize(dict) {
    if (!dict) {
        return 0;
    }
    
    var size = 0;
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) size++;
    }
    return size;
}

module.exports = function(url, dbName, login, password) {
    return new DBHelper(url, dbName, login, password);
};
