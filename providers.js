module.exports = {
 "facebook-login": {
   "provider": "facebook",
   "module": "passport-facebook",
   "clientID": process.env.FACEBOOK_APP_ID,
   "clientSecret": process.env.FACEBOOK_APP_SECRET,
   "callbackURL": "/auth/facebook/callback",
   "authPath": "/auth/facebook",
   "callbackPath": "/auth/facebook/callback",
   "successRedirect": "/",
   "scope": ["email", "user_link"],
   "profileFields": ["link", "locale", "name", "timezone", "verified", "email", "updated_time"]
  },
  "twitter-login": {
    "provider": "twitter",
    "authScheme": "oauth",
    "module": "passport-twitter",
    "callbackURL": "/auth/twitter/callback",
    "authPath": "/auth/twitter",
    "callbackPath": "/auth/twitter/callback",
    "successRedirect": "/",
    "failureRedirect": "/",
    "consumerKey": process.env.TWITTER_CONSUMER_KEY,
    "consumerSecret": process.env.TWITTER_CONSUMER_SECRET,
    "failureFlash": false,
    "callbackHTTPMethod": "get"
  },
  "github-login": {
    "provider": "github",
    "authScheme": "oauth",
    "module": "passport-github",
    "callbackURL": "/auth/github/callback",
    "authPath": "/auth/github",
    "callbackPath": "/auth/github/callback",
    "successRedirect": "/",
    "failureRedirect": "/",
    "clientID": process.env.GITHUB_CLIENT_ID,
    "clientSecret": process.env.GITHUB_CLIENT_SECRET,
    "failureFlash": false,
    "callbackHTTPMethod": "get",
    "scope": ["email", "profile"]
  }
};