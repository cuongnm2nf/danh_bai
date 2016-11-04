module.exports = function() {
    var constants = {
        SESSION_SECRET : "48C31843B34EB233D1FC88B7CEF8B",
        platformInfo: {
            client_id: "09a7v9b6chc24h021950djyx0d2w3k63",
            client_secret: "5c147717b1ql1c9snwfzit0qqgf15r7y"
        },

        gameInfo: {
            //hostName: 'http://sweetcrash.opf.z-zeus.com',
            hostName: 'http://localhost:5000',

            // For deploy on server
            //paymentCallbackURL: 'http://sweetcrash.opf.z-zeus.com/payment/callback',
            // For local
            paymentCallbackURL: 'http://localhost:5000/payment/callback',
            // For deploy on server
            //redirectURL: 'http://sweetcrash.opf.z-zeus.com'
            // For local
            redirectURL: 'http://localhost:5000/daifugo/index.html'
        }
    };

    return constants;
};