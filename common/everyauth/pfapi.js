var request = require("request");
var log4js = require('log4js');
var logger = log4js.getLogger('platform');
var constants = require('../constants')();

/**
 * @param info
 * @param accessToken
 * @param refreshToken
 * @constructor
 */
var Platform = function(info, accessToken, refreshToken) {
    logger.trace('enter Platform Initialization');
    this.info = info;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    logger.trace('input variables');
    logger.trace(info);
    logger.trace(accessToken);
    logger.trace(refreshToken);
};

/**
 * Set token properties
 */
Platform.prototype.setToken = function(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
};

/**
 * Invoke API, that is used to get user profile
 * @param callback: function: callback function after invoke API
 * @param useRefreshToken: boolean: determine that use refresh token or not
 */
Platform.prototype.requestUserInfo = function(callback, useRefreshToken) {
    logger.trace('enter requestUserInfo');
    var userUrl = constants.OPEN_URL.API_BASIC + 'api/oauth/profile.do',
        me = this,
        headers = {
            'Authorization' : 'Bearer ' + me.accessToken,
            'Accept' : 'application/json',
            'Content-Type': 'application/json'
        };

    logger.trace('request user info');
    logger.trace('useRefreshToken: ' + useRefreshToken);
    if (me.accessToken && me.accessToken.length > 0) {
        request.get({
            url: userUrl
            , headers: headers
            , json: true
        }, function (err, res, body) {
            if (!err) {
                if (body.statusCode === 0) {
                    logger.info('ok, got user info');
                    if (callback) {
                        callback(true, body);
                    }
                } else {
                    logger.error('or system error, code: ' + (body.error_description) ? body.error_description:'undefined');
                    logger.error(body);
                    if (body.error) {
                        if (useRefreshToken && me.refreshToken && me.refreshToken.length > 0) {
                            me.refreshAccessToken(function(success, body) {
                                if (success && !body.error) {
                                    logger.info('refresh access token ok, new access token:' + body.access_token);
                                    me.accessToken = body.access_token;
                                    me.requestUserInfo(callback, false);
                                } else {
                                    logger.error('error in refresh access token');
                                    logger.error(body.error);
                                    if (callback) {
                                        callback(false, 'login_required');
                                    }
                                }
                            });
                        } else {
                            logger.warn('no refresh token info, need to relogin');
                            if (callback) {
                                callback(false, 'login_required');
                            }
                        }
                    } else {
                        if (callback) {
                            callback(false, 'network_error or system error');
                        }
                    }
                }
            } else {
                logger.error('network error when connect to zeus platform');
		        logger.error(err);
                if (callback) {
                    callback(false, 'network_error');
                }
            }
        });
    } else {
        logger.warn('no access token info, need to relogin');
        if (callback) {
            callback(false, 'access_token_required');
        }
    }
};

/**
 * Refresh access token
 * @param callback: function: callback function after finish refresh access token
 */
Platform.prototype.refreshAccessToken = function(callback) {
    logger.trace('enter refreshAccessToken');
    var url = constants.OPEN_URL.AUTH_BASIC + 'oauth/token.do',
        me = this,
        opts = {
            url: url,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            form: {
                client_id : me.info.platformInfo.client_id,
	            client_secret : me.info.platformInfo.client_secret,
	            refresh_token : me.refreshToken,
	            grant_type : 'refresh_token'
            },
            json: true
        };

    logger.info('request new access token with refresh token: ' + me.refreshToken);
    request(opts, function (err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.error) {
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error('or system error, code: ' + (body.error.details) ? body.error.details:'undefined');
                logger.error(body);
                if (callback) {
                    callback(false, 'network_error or system error');
                }
            } else {
                logger.info('ok, got new access token');
                logger.info(body);
                if (callback) {
                    callback(true, body);
                }
            }
        } else {
            logger.error('unknown error');
            logger.error(err);
            if (callback) {
                callback(false, err);
            }
        }
    });
};

/**
 * Invoke API, that is used to request buy entry for play game
 * @param amount: number: amount of entry
 * @param summary: string: summary of payment transaction
 * @param detail: array: more detail information of payment transaction
 * @param callback: string: payment finish callback
 * @param useRefreshToken: boolean: determine that use refresh token or not
 */
Platform.prototype.requestPayment = function(amount, summary, detail, callback, useRefreshToken) {
    logger.trace('enter requestPayment');
    var paymentUrl = constants.OPEN_URL.API_BASIC + 'api/oauth/request_payement_id.do',
        me = this,
        opts = {
            url: paymentUrl,
            method: 'POST',
            body: {
                amount : amount,
                summary: summary,
                callback: this.info.gameInfo.paymentCallbackURL
            },
            headers: {
                'Authorization' : 'Bearer ' + me.accessToken,
                'Accept' : 'application/json',
                'Content-Type': 'application/json'
            },
            json: true
        };

    if (detail) {
        opts.body.detail = detail;
    }

    logger.trace('begin request payment');
    logger.trace('useRefreshToken: ' + useRefreshToken);
    if (me.accessToken && me.accessToken.length > 0) {
        request(opts, function (err, res, body) {
            if (!err) {
                if (body.statusCode === 0) {
                    logger.info('ok, got z');
                    if (callback) {
                        callback(true, {
                            request_id: body.request_id,
                            accesstoken: me.accessToken
                        });
                    }
                } else {
                    logger.error('or system error, code: ' + (body.error_description) ? body.error_description:'undefined');
                    logger.error(body);
                    if (body.error) {
                        if (useRefreshToken && me.refreshToken && me.refreshToken.length > 0) {
                            me.refreshAccessToken(function(success, body) {
                                if (success && !body.error) {
                                    logger.info('refresh access token ok, new access token:' + body.access_token);
                                    me.accessToken = body.access_token;
                                    me.requestPayment(amount, summary, detail, callback, false);
                                } else {
                                    logger.error('error in refresh access token');
                                    logger.error(body.error);
                                    if (callback) {
                                        callback(false, {
                                            detail: 'error in refresh access token'
                                        });
                                    }
                                }
                            });
                        } else {
                            logger.warn('no refresh token info, need to relogin');
                            if (callback) {
                                callback(false, {
                                    detail: 'no refresh token info, need to relogin'
                                });
                            }
                        }
                    } else {
                        logger.error('unknown error');
                        if (callback) {
                            callback(false, 'unknown error');
                        }
                    }
                }
            } else {
                logger.error('network error when connect to Open platform');
		        logger.error(err);
                if (callback) {
                    callback(false, {
                        detail: 'network error when connect to Open platform'
                    });
                }
            }
        });
    } else {
        logger.warn('no access token info, need to relogin');
        if (callback) {
            callback(false, {
                detail: 'no access token info, need to relogin'
            });
        }
    }
};

/**
 * Invoke verify transaction API from Open PF,
 * that is used to verify transaction
 * @param tid: transaction id
 * @param callback: callback function after invoke API
 */
Platform.prototype.verifyTransaction = function(tid, callback) {
    logger.trace('enter verifyTransaction');
    var url = constants.OPEN_URL.API_BASIC + 'api/public/app/verify_transaction.do?tran=' + tid,
    me = this,
    opts = {
        url: url,
        method: 'GET',
        auth: {
            user: me.info.platformInfo.client_id,
            pass: me.info.platformInfo.client_secret
        },
        json: true
    };

    logger.info('request verify transaction: ' + tid);
    request(opts, function (err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                logger.error('access invalid, code: ' + res.statusCode);
		        logger.error(res);
                if (body) {
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                    }
                }
                if (callback) {
                    callback(false, 'network_error or system error');
                }
            } else {
                logger.info('transaction verified ok');
                logger.info(body);
                if (callback) {
                    callback(true, body);
                }
            }
        } else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, err);
            }
        }
    });
};

/**
 * Invoke API, that is used to transfer money from user wallet to application wallet when user click play game
 * @param amount: number: amount to transfer
 * @param summary: string: summary of transaction
 * @param userId: string: user ID that own the wallet
 * @param playDetails: array: more detail information of this play
 * @param transactionDetails: array: more detail information of transaction
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.gamePlay = function(amount, summary, userId, playDetails, transactionDetails, callback) {
    logger.trace('enter gamePlay');
    var gamePlayUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/game_play.do',
        me = this,
        opts = {
            url: gamePlayUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                amount: amount,
                summary: summary,
                user_id: userId
            },
            json: true
        };

    if (playDetails) {
        opts.body.play_details = playDetails;
    }

    if (transactionDetails) {
        opts.body.transaction_details = transactionDetails;
    }

    logger.trace('begin game play');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body) {
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, played game');
                if (callback) {
                    callback(true, body)
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to transfer money from application wallet to user wallet,
 * and create play history record when user finish one play
 * @param playId: number: ID of correspond play record
 * @param amount: number: amount to transfer
 * @param summary: string: summary of transaction
 * @param userId: string: user ID that own the wallet
 * @param transactionDetails: array: more detail information of transaction
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.gamePlayEnd = function(playId, amount, summary, userId, transactionDetails, callback) {
    logger.trace('enter gamePlayEnd');
    var gamePlayEndUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/game_play_end.do',
        me = this,
        opts = {
            url: gamePlayEndUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                play_id: playId,
                amount: amount,
                summary: summary,
                user_id: userId
            },
            json: true
        };

    if (transactionDetails) {
        opts.body.transaction_details = transactionDetails;
    }

    logger.trace('begin game play end');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, end game');
                if (callback) {
                    callback(true, body);
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to get game play setting from server
 * @param date: string: date which need to get game rule corresponding. Format: yyyy-MM-dd
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.gameRule = function(date, callback) {
    logger.trace('enter gameRule');
    var gameRuleUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/game_rule.do',
        me = this,
        opts = {
            url: gameRuleUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                request_date: date
            },
            json: true
        };

    logger.trace('begin get game rule');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, get game rule');
                if (callback) {
                    callback(true, body);
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to get event information from server
 * @param date: string: date which need to get event information corresponding. Format: yyyy-MM-dd
 * @param language: string: user's language code ('en','jp','cn')
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.gameEvent = function(date, language, callback) {
    logger.trace('enter gameEvent');
    var gameEventUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/game_event.do',
        me = this,
        opts = {
            url: gameEventUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                request_date: date,
                language: language
            },
            json: true
        };

    logger.trace('begin get game event');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, get game event');
                if (callback) {
                    callback(true, body);
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to transfer money from user wallet to application wallet when play game in event
 * @param amount: number: amount to transfer
 * @param summary: string: summary of transaction
 * @param userId: string: user ID that own the wallet, and join event
 * @param eventId: number: event ID
 * @param playDetails: array: more detail information of this play
 * @param transactionDetails: array: more detail information of transaction
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.eventPlayStart = function(amount, summary, userId, eventId, playDetails, transactionDetails, callback) {
    logger.trace('enter eventPlayStart');
    var eventPlayStartUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/event_play_start.do',
        me = this,
        opts = {
            url: eventPlayStartUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                amount: amount,
                summary: summary,
                user_id: userId,
                event_id: eventId
            },
            json: true
        };

    if (playDetails) {
        opts.body.play_details = playDetails;
    }

    if (transactionDetails) {
        opts.body.transaction_details = transactionDetails;
    }

    logger.trace('begin game play in event');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body) {
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, played game in event');
                if (callback) {
                    callback(true, body)
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to push user's point when user finish play in event mode to platform
 * @param eventId: number: event ID
 * @param userId: string: user ID that join event
 * @param score: number: user's score
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.eventPlayUpdate = function(eventId, userId, score, callback) {
    logger.trace('enter eventPlayUpdate');
    var eventPointUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/event_play_update.do',
        me = this,
        opts = {
            url: eventPointUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                event_id: eventId,
                user_id: userId,
                user_score: score
            },
            json: true
        };

    logger.trace('begin push event point');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, pushed game point');
                if (callback) {
                    callback(true, body);
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke API, that is used to notify user ranking in event, after event finished
 * @param eventId: number: event ID that user joined
 * @param userId: string: user ID that join event
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.eventRankNotification = function(eventId, userId, callback) {
    logger.trace('enter eventRankNotification');
    var eventRankNotificationUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/ranking_notification.do',
        me = this,
        opts = {
            url: eventRankNotificationUrl,
            method: 'POST',
            auth: {
                user: me.info.platformInfo.client_id,
                pass: me.info.platformInfo.client_secret
            },
            body: {
                event_id: eventId,
                user_id: userId
            },
            json: true
        };

    logger.trace('begin notify event rank');
    request(opts, function(err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            }
            else {
                logger.info('ok, notified event rank');
                if (callback) {
                    callback(true, body);
                }
            }
        }
        else {
            logger.error('network error when connect to Open platform');
            logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

/**
 * Invoke transfer money API from Open PF,
 * that is used to transfer money from game wallet to specified wallet
 * @param amount: number: amount to transfer
 * @param summary: string: summary of transaction
 * @param userID: string: user ID that own the wallet is transferred to
 * @param detail: array: more detail information of transaction
 * @param callback: function: callback function after invoke API
 */
Platform.prototype.transferMoney = function(amount, summary, userID, detail, callback) {
    logger.trace('enter transferMoney');
    var paymentUrl = constants.OPEN_URL.API_BASIC + 'api/public/app/transfer_money.do',
    me = this,
    opts = {
        url: paymentUrl,
        method: 'POST',
        auth: {
            user: me.info.platformInfo.client_id,
            pass: me.info.platformInfo.client_secret
        },
        body: {
            amount : amount,
            summary: summary,
            co_wallet: {
                type: 1,
                owner_id: userID
            }
        },
        json: true
    };

    if (detail){
        opts.body.transaction_details = detail;
    }

    logger.trace('begin transfer money');
    request(opts, function (err, res, body) {
        if (!err) {
            if (parseInt(res.statusCode/100, 10) !== 2 || body.statusCode !== 0) {
                var detail = {
                    detail: 'platform error or access invalid'
                };
                logger.error('access invalid, code: ' + res.statusCode);
                logger.error(res);
                if (body){
                    logger.error('or system error, code: ' + (body && body.statusCode) ? body.statusCode:'undefined');
                    logger.error(body);
                    if (body.details) {
                        logger.error('error detail: ' + body.details);
                        detail.detail = body.details;
                    }
                }
                if (callback) {
                    callback(false, detail);
                }
            } else {
                logger.info('ok, transfered money');
                if (callback){
                    callback(true, body);
                }
            }
        } else {
            logger.error('network error when connect to Open platform');
	        logger.error(err);
            if (callback) {
                callback(false, {
                    detail: 'network error when connect to Open platform'
                });
            }
        }
    });
};

module.exports = Platform;
