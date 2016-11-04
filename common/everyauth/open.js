var oauthModule = require('./oauth2')
, url = require('url')
, request = require('../../node_modules/everyauth/node_modules/request')
, constants = require('../constants')();

var open = 
    oauthModule.submodule('open')
    .configurable({
        scope: "read or write permission (read,write)",
        myHostname: "current host name"
    })

    .oauthHost(constants.OPEN_URL.AUTH_BASIC)
    .apiHost(constants.OPEN_URL.API_BASIC)

    .authPath('/oauth/authorize.do')
    .authQueryParam('response_type', 'code')

    .accessTokenPath('/oauth/token.do')
    .accessTokenParam('grant_type', 'authorization_code')
    .accessTokenParam('response_type', 'token')
    .accessTokenHttpMethod('post')
    .postAccessTokenParamsVia('data')
    .entryPath('/auth/open')
    .callbackPath('/auth/open/callback')
    .basicAuth(true)

    .authQueryParam({
        scope: function () {
            return this._scope && this.scope();
        }
    })

    .addToSession( function (sess, auth) {
        this._super(sess, auth);
        if (auth.refresh_token) {
            sess.auth[this.name].refreshToken = auth.refresh_token;
            sess.auth[this.name].expiresInSeconds = parseInt(auth.expires_in, 10);
        }
    })

    .authCallbackDidErr( function (req) {
        var parsedUrl = url.parse(req.url, true);
        return parsedUrl.query && !!parsedUrl.query.error;
    })

    .handleAuthCallbackError( function (req, res) {
        //var parsedUrl = url.parse(req.url, true)
        //, errorDesc = parsedUrl.query.error + "; " + parsedUrl.query.error_description;
        throw new Error("You must configure handleAuthCallbackError");
    })
    .moduleErrback( function (err, seqValues) {
        var serverResponse = seqValues.res;
        if (err instanceof Error) {
            var next = seqValues.next;
            return next(err);
        }
        if (err.extra) {
            var openResponse = err.extra.res;
            serverResponse.writeHead(
                openResponse.statusCode
                , openResponse.headers);
            serverResponse.end(err.extra.data);
        } else if (err.statusCode) {
            serverResponse.writeHead(err.statusCode);
            serverResponse.end(err.data);
        } else {
            throw new Error('Unsupported error type');
        }
    })
    .fetchOAuthUser( function (accessToken) {
        console.log('on fetchOAuthUser: ' + accessToken);
        var promise = this.Promise()
        , userUrl = this._apiHost + 'api/oauth/profile.do'
        , headers = {
            'Authorization' : 'Bearer ' + accessToken,
            'Accept' : 'application/json',
            'Content-Type': 'application/json' 
        };
        request.get({
            url: userUrl
            , headers: headers
        }, function (err, res, body) {
            if (err) {
                return promise.fail(err);
            }
            if (parseInt(res.statusCode/100, 10) !== 2) {
                return promise.fail({extra: {data: body, res: res}});
            }
            var info = JSON.parse(body);
            if (info.statusCode === 0) {
                if (info.error === undefined) {
                    promise.fulfill(info);
                } else {
                    return promise.fail({extra: {data: body, res: res}});
                }
            } else {
                return promise.fail({extra: {data: body, res: res}});
            }
        });
        return promise;
    });

/**
 * @param {Object} params in an object that includes the keys:
 * - refreshToken: The refresh token returned from the authorization code
 *   exchange
 * - clientId: The client_id obtained during application registration
 * - clientSecret: The client secret obtained during the application registration
 * @param {Function} cb
 */
open.refreshToken = function (params, cb) {
    request.post(this._oauthHost + 'oauth/token.do', {
        form: {
            refresh_token: params.refreshToken
            , client_id: params.clientId
            , client_secret: params.clientSecret
            , grant_type: 'refresh_token'
        }
    }, function (err, res, body) {
        // `body` should look like:
        // {
        //   "access_token":"1/fFBGRNJru1FQd44AzqT3Zg",
        //   "expires_in":3920,
        //   "token_type":"Bearer",
        // }
        if (err) {
            return cb(err);
        }
        if (parseInt(res.statusCode / 100, 10) !== 2) {
            cb(null, {}, res);
        } else {
            body = JSON.parse(body);
            cb(null, {
                accessToken: body.access_token
                , expiresIn: body.expires_in
                , idToken: body.id_token
            }, res);
        }
    });
    return this;
};

module.exports = open;
