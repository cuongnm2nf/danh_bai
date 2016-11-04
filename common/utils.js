var log4js = require('log4js');
var logger = log4js.getLogger('commonUtils');
var crypto = require('crypto');

/*******************************************************************************
 * Check if two numbers are equal or not
 */
exports.isEqual = function(a, b) {
	if (a === undefined || b === undefined) {
		return false;
	}
	if (isInteger(a) && isInteger(b)) {
		return (a == b);
	}
	return (Math.abs(a - b) <= 1e-5);
}
/*******************************************************************************
 * Check if an number is integer
 */
exports.isInteger = function(n) {
	return parseInt(n) === n;
}
/*******************************************************************************
 * Generate a random integer a which is: min <= a <= max
 */
exports.genRandomInt = function(min, max) {
    logger.trace("[genRandomInt] Enter generate random integer from " + min + " to " + max);
    try {
        var totalRandom = max - min + 1;
        var exclude = Math.pow(2, 32) - (Math.pow(2, 32) % totalRandom);
        var biasCount = 0;

        do {
            if (biasCount > 0) {
                logger.trace("[genRandomInt] Bias count = " + biasCount);
            }

            // get random 4 bytes
            var buff = crypto.randomBytes(4);
            var randomDev = buff.readUInt32LE(0);

            if (randomDev < exclude) {
                var ret = (randomDev % totalRandom) + min;
                logger.trace("[genRandomInt] Get random interger = " + ret);
                return ret;
            }

            biasCount++;
        }
        while (true);
    } catch(e) {
        logger.error("[genRandomInt] Exception occurs: " + e);
        return Math.floor((Math.random() * (max - min + 1)) + min);
    }
}
/*******************************************************************************
 * Generate a random float a which is: min <= a <= max
 */
exports.genRandomFloat = function() {
	return Math.random();
}

/**
 * Convert a date object to string for insert/update to timestamp field of postgres db
 */
exports.date2String = function(date) {
	var dateStr = "" + date.getFullYear() + "-" + (date.getMonth()+1)
                        + "-" + (date.getDate())
                        + " " + date.getHours()
                        + ":" + date.getMinutes()
                        + ":" + date.getSeconds();
	return dateStr;
}

/**
 * Convert a string in date format to really date object
 */
exports.string2Date = function(dateStr) {
	return new Date(dateStr);
}

/*******************************************************************************
 * Create an 2d array with given length
 */
exports.create2DArray = function(length) {
	return createArray(length, length);
}
/*******************************************************************************
 * Create n-dimension array
 */
exports.createArray = createArray;
function createArray(length) {
	var arr = new Array(length || 0), i = length;

	if (arguments.length > 1) {
		var args = Array.prototype.slice.call(arguments, 1);
		while (i--)
		arr[length - 1 - i] = createArray.apply(this, args);
	}

	return arr;
}

/*******************************************************************************
 * Shuffle an array
 */
exports.shuffle = function(array) {
	var counter = array.length, temp, index;

	// While there are elements in the array
    for (var i=counter-1; i>=1; i--) {
		// Pick a random index
        index = this.genRandomInt(0, i);

		// And swap the last element with it
        temp = array[i];
        array[i] = array[index];
        array[index] = temp;
	}

	return array;
}

/**
 * Draw a sub range of values from a total range of values
 * @param array: array with n elements
 * @param k: k <=n, number elements to select from array
 */
exports.shuffleReservoir = function(array, k) {
    // Run the Fisher-Yates algorithm for this array
    var random_array = this.shuffle(array);

    // return first k-items
    return random_array.slice(0, k);
}

exports.formatDate = function(dateObj) {
	if (!dateObj) {
		return "";
	}
	// year
	var ret = dateObj.getFullYear() + "-";

	// month
	var month = dateObj.getMonth() + 1;
	if (month < 10) {
		ret += "0";
	}
	ret += month + "-";

	// date
	var date = dateObj.getDate();
	if (date < 10) {
		ret += "0";
	}
	ret += date;
	return ret;
};
