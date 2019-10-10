'use strict';

require('dotenv').config();

var bodyParser = require('body-parser');
var boot = require('loopback-boot');
var cookieParser = require('cookie-parser');
var cors = require("cors");
var fs = require("fs");
var http = require('http');
var https = require('https');
var loopback = require('loopback');
var path = require('path');
var passport = require('passport');
var session = require('express-session');
var socketio = require('socket.io');

var app = module.exports = loopback();

// boot scripts mount components like REST API
boot(app, __dirname);

// enable cors
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true,
}));

// The access token is only available after boot
app.middleware('auth', loopback.token({
  model: app.models.AccessToken,
}));

var RedisStore = require('connect-redis')(session);
app.middleware("session", session({
  store: new RedisStore({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: true
}));

app.middleware('session:before', cookieParser(app.get('cookieSecret')));

app.middleware('session:after', function addAccountAddressToSession(req, res, next) {
  if (req.query.ethereumAccountAddress) {
    req.session.ethereumAccountAddress = req.query.ethereumAccountAddress;
  }
  // req.session.loginNonce = Math.floor(Math.random() * 1000000);
  // console.log("setting nonce for ", req.session.id, req.session.loginNonce);
  // EthereumStrategy.setnonce(req.session.id, req.session.loginNonce);
  next();
});

app.middleware('session:after', function addSocketIdtoSession(req, res, next) {
  if (req.query.socketId) {
    req.session.socketId = req.query.socketId;
  }
  next();
});

// Setup Passport
var PassportConfigurator = require('loopback-component-passport').PassportConfigurator;
var passportConfigurator = new PassportConfigurator(app);
var EthereumStrategy = require('./passport-ethereum');

// attempt to build the providers/passport config
var config = {};
try {
  config = require('../providers.js');
} catch (err) {
  console.trace(err);
  process.exit(1); // fatal
}

passportConfigurator.init();

passportConfigurator.setupModels({
  userModel: app.models.User,
  userIdentityModel: app.models.UserIdentity,
  userCredentialModel: app.models.UserCredential
});
for (var s in config) {
  var c = config[s];
  c.session = c.session !== false;

  // After successful OAuth login let's save account data to the database
  c.loginCallback = function(req, done) {
    return async function(err, user, identity, token) {
      var authInfo = {
        identity: identity,
      };
      if (token) {
        authInfo.accessToken = token;
      }
      const profile = identity.profile, provider = identity.provider;
      const profileUrl = provider == 'github' || provider == 'facebook' ? profile.profileUrl :
                         (provider == 'twitter' ? "https://twitter.com/" + profile.username : "");
      const name = provider == 'github' || provider == 'twitter' ? profile.displayName :
                   provider == 'facebook' ? profile._json.first_name + " " + profile._json.last_name : " ";
      var account = await app.models.Account.findOne({ where: { ethereumAccountAddress: req.session.ethereumAccountAddress }});
      if (!account) {
        account = new app.models.Account();
        account.ethereumAccountAddress = req.session.ethereumAccountAddress;
        account.name = name;
      }
      account.userId = user.id;
      account[provider + "URL"] = profileUrl;
      // Skip signature check because this all happening on the server with no client interaction so we dont have or need a signature
      account.save({ skipSignatureCheck: true });

      // Tell the client we are done so it can close the popup window
      const io = req.app.get('io');
      io.in(req.session.socketId).emit(provider, account);

      done(err, user, authInfo);
    };
  };
  passportConfigurator.configureProvider(s, c);
}

// Add our Ethereum strategy for authenticating by signing a message on the client
const ethStrategy = new EthereumStrategy(
  function(address, done) {
    console.log("eth strategy", address, done);
    User.findOne({ username: address }, function (err, user) {
      console.log("loooking for user", err, user);
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user);
    });
  }
);

passport.use(ethStrategy);

app.get('/nonce',
  async function(req, res) {
    // TODO: require ethereumAccountAddress
    const nonce = await app.models.Account.getAddressNonce(req.query.address);
    console.log("getting nonce for address ", req.query.address, nonce);
    res.send(nonce);
  }
);

app.post('/loginByEthSign',
  passport.authenticate('ethereum', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("successful login", req);
    res.redirect('/');
  }
);

app.start = function() {
  if (process.env.NODE_ENV == 'production') {
    app.use(function (req, res, next) {
      res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
      if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "http") {
        return res.redirect(301, 'https://' + req.host + req.url);
      } else {
        return next();
      }
    });

    return app.listen(app.get('port'), function() {
      app.emit('started');
      var baseUrl = app.get('url').replace(/\/$/, '');
      console.log('LoopBack server listening at: %s', baseUrl);
    });
  }

  // Local dev, check for a local SSL certificate and if found use https
  let privateKey, certificate, server, useHTTPS = false;

  try {
    privateKey = fs.readFileSync(path.join(__dirname, './private/privatekey.pem')).toString();
    certificate = fs.readFileSync(path.join(__dirname, './private/certificate.pem')).toString();
    useHTTPS = true;
  } catch(e) {}

  if (useHTTPS) {
    var options = {
      key: privateKey,
      cert: certificate
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }

  server.listen(app.get('port'), function() {
    var baseUrl = (useHTTPS ? 'https://' : 'http://') + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  return server;
};

// start the server if `$ node server.js`
if (require.main === module) {
  // Connecting sockets to the server and adding them to the request
  // so that we can access them later in the controller

  const io = socketio(app.start());
  app.set('io', io);
}