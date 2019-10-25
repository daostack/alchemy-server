'use strict';

const providers = {};

const baseURL = process.env.BASE_URL || '';

if (process.env.FACEBOOK_APP_ID) {
  providers['facebook-link'] = {
    'provider': 'facebook',
    'module': 'passport-facebook',
    'clientID': process.env.FACEBOOK_APP_ID,
    'clientSecret': process.env.FACEBOOK_APP_SECRET,
    'callbackURL': baseURL + '/link/facebook/callback',
    'authPath': '/link/facebook',
    'callbackPath': '/link/facebook/callback',
    'successRedirect': baseURL + '/linkSuccess',
    'failureRedirect': baseURL + '/linkFail',
    'scope': ['email', 'user_link'],
    'profileFields': ['link', 'locale', 'name', 'timezone', 'verified', 'email', 'updated_time'],
    'link': true,
  };
}

if (process.env.TWITTER_CONSUMER_KEY) {
  providers['twitter-link'] = {
    'provider': 'twitter',
    'authScheme': 'oauth',
    'module': 'passport-twitter',
    'callbackURL': baseURL + '/link/twitter/callback',
    'authPath': '/link/twitter',
    'callbackPath': '/link/twitter/callback',
    'successRedirect': baseURL + '/linkSuccess',
    'failureRedirect': baseURL + '/linkFail',
    'consumerKey': process.env.TWITTER_CONSUMER_KEY,
    'consumerSecret': process.env.TWITTER_CONSUMER_SECRET,
    'failureFlash': false,
    'callbackHTTPMethod': 'get',
    'link': true,
  };
}

if (process.env.GITHUB_CLIENT_ID) {
  providers['github-link'] = {
    'provider': 'github',
    'authScheme': 'oauth',
    'module': 'passport-github',
    'callbackURL': baseURL + '/link/github/callback',
    'authPath': '/link/github',
    'callbackPath': '/link/github/callback',
    'successRedirect': baseURL + '/linkSuccess',
    'failureRedirect': baseURL + '/linkFail',
    'failureQueryString': true,
    'failureFlash': true,
    'clientID': process.env.GITHUB_CLIENT_ID,
    'clientSecret': process.env.GITHUB_CLIENT_SECRET,
    'failureFlash': false,
    'callbackHTTPMethod': 'get',
    'scope': ['email', 'profile'],
    'link': true,
  };
}

module.exports = providers;
