const providers = {};

const base_url = process.env.BASE_URL || "";

if (process.env.FACEBOOK_APP_ID) {
  providers['facebook-login'] = {
   "provider": "facebook",
   "module": "passport-facebook",
   "clientID": process.env.FACEBOOK_APP_ID,
   "clientSecret": process.env.FACEBOOK_APP_SECRET,
   "callbackURL": base_url + "/auth/facebook/callback",
   "authPath": "/auth/facebook",
   "callbackPath": "/auth/facebook/callback",
   "successRedirect": "/",
   "scope": ["email", "user_link"],
   "profileFields": ["link", "locale", "name", "timezone", "verified", "email", "updated_time"]
  };
}

if (process.env.TWITTER_CONSUMER_KEY) {
  providers['twitter-login'] = {
    "provider": "twitter",
    "authScheme": "oauth",
    "module": "passport-twitter",
    "callbackURL": base_url + "/auth/twitter/callback",
    "authPath": "/auth/twitter",
    "callbackPath": "/auth/twitter/callback",
    "successRedirect": "/",
    "failureRedirect": "/",
    "consumerKey": process.env.TWITTER_CONSUMER_KEY,
    "consumerSecret": process.env.TWITTER_CONSUMER_SECRET,
    "failureFlash": false,
    "callbackHTTPMethod": "get"
  };
}

if (process.env.GITHUB_CLIENT_ID) {
  providers["github-login"] = {
    "provider": "github",
    "authScheme": "oauth",
    "module": "passport-github",
    "callbackURL": base_url + "/auth/github/callback",
    "authPath": "/auth/github",
    "callbackPath": "/auth/github/callback",
    "successRedirect": "/",
    "failureRedirect": "/",
    "clientID": process.env.GITHUB_CLIENT_ID,
    "clientSecret": process.env.GITHUB_CLIENT_SECRET,
    "failureFlash": false,
    "callbackHTTPMethod": "get",
    "scope": ["email", "profile"]
  };
}

module.exports = providers;