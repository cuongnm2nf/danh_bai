module.exports = function() {
    var constants = {
        // Language setting
        SettingLanguage: {
            ENGLISH: 'en',
            JAPANESE: 'jp',
            CHINESE: 'cn'
        },
        PLATFORM_URL: {
            AUTHENTICATE: "http://103.3.189.245:8080/zeus-platform/api/pb/authenticate.do",
            GET_PROFILE: "http://103.3.189.245:8080/zeus-platform/api/pr/profile.do",
            GAME_Z: "http://103.3.189.245:8080/zeus-platform/api/pr/z/game_z.do",
            TOKEN: "http://103.3.189.245:8080/zeus-platform/oauth/token.do"
        },
        OPEN_URL: {
            API_BASIC: 'http://api.opf.z-zeus.com/',
            AUTH_BASIC: 'http://mypage.opf.z-zeus.com/'
        }
    };
    
    return constants;
};