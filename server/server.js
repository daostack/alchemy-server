'use strict';

require('dotenv').config();

var bodyParser = require('body-parser');
var boot = require('loopback-boot');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var fs = require('fs');
var http = require('http');
var https = require('https');
var loopback = require('loopback');
var path = require('path');
var passport = require('passport');
var session = require('express-session');
var socketio = require('socket.io');
var utils = require('./utils');

var app = module.exports = loopback();

// boot scripts mount components like REST API
boot(app, __dirname);

// enable cors
var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
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
const sessionOptions = {
  cookie: {
    expires: false,
    secret: process.env.SESSION_SECRET,
    secure: process.env.NODE_ENV == 'production',
    maxAge: 360000000,
  },
  name: 'sid',
  resave: false,
  store: new RedisStore({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
};
app.middleware('session', session(sessionOptions));

app.middleware('session:before', cookieParser(app.get('cookieSecret')));

app.middleware('session:after', function addAccountAddressToSession(req, res, next) {
  if (req.query.ethereumAccountAddress) {
    req.session.ethereumAccountAddress = req.query.ethereumAccountAddress;
  }
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
  userCredentialModel: app.models.UserCredential,
});
for (var s in config) {
  var c = config[s];
  c.session = c.session !== false;
  passportConfigurator.configureProvider(s, c);
}

// Add our Ethereum strategy for authenticating by signing a message on the client
const ethStrategy = new EthereumStrategy(
  { passReqToCallback: true },
  function(req, address, done) {
    const password = utils.generateKey('password');
    app.models.User.findOrCreate({ username: address }, { username: address, emailVerified: true, password, email: address + '@daostack.loopback' }, async function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }

      // Connect user to account
      var account = await app.models.Account.findOne({ where: { ethereumAccountAddress: address } });
      // TODO: what if can't find?? That would be weird
      account.userId = user.id;
      account.save();

      user.accessTokens.create(
        {
          created: new Date(),
          ttl: Math.min(
            user.constructor.settings.ttl,
            user.constructor.settings.maxTTL
          ),
        },
        function(err, token) {
          if (err) {
            console.error('Login error', err);
            return err.code === 'LOGIN_FAILED' ?
              done(null, false, { message: 'Failed to create token.' }) :
              done(err);
          }
          done(err, user, { accessToken: token.id });
        }
      );
    });
  }
);

passport.use(ethStrategy);

app.get('/nonce',
  async function(req, res) {
    const nonce = await app.models.Account.getAddressNonce(req.query.address);
    ethStrategy.setNonce(req.session.id, nonce);
    res.send(nonce);
  }
);

app.get('/linked',
  async function(req, res) {
    const credentials = await req.user.credentials.findOne({ order: 'modified DESC' });
    const profile = credentials.profile;
    const provider = credentials.provider;
    const profileUrl = provider == 'github' || provider == 'facebook' ? profile.profileUrl :
                       (provider == 'twitter' ? 'https://twitter.com/' + profile.username : '');
    const name = provider == 'github' || provider == 'twitter' ? profile.displayName :
                 provider == 'facebook' ? profile._json.first_name + ' ' + profile._json.last_name : ' ';
    var account = await app.models.Account.findOne({ where: { ethereumAccountAddress: req.session.ethereumAccountAddress } });

    // TODO: this should never happen
    if (!account) {
      account = new app.models.Account();
      account.ethereumAccountAddress = req.session.ethereumAccountAddress;
      account.userId = req.user.id;
    }
    if (!account.name) {
      account.name = name;
    }
    account[provider + 'URL'] = profileUrl;
    account.save();

    // Tell the client we are done so it can close the popup window
    const io = req.app.get('io');
    io.in(req.session.socketId).emit(provider, account);

    res.send('Account linked');
  }
);

app.get('/linkFail',
  async function(req, res) {
    res.send('Failed to link account for unkown reason');
  }
);

app.post('/loginByEthSign',
  passport.authenticate('ethereum'),
  function(req, res) {
    console.log('Successful login');
    res.json({ token: req.authInfo.accessToken });
  }
);

app.start = function() {
  if (process.env.NODE_ENV == 'production') {
    app.use(function(req, res, next) {
      res.setHeader('Strict-Transport-Security', 'max-age=8640000; includeSubDomains');
      if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'http') {
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
  } catch (e) {}

  if (useHTTPS) {
    var options = {
      key: privateKey,
      cert: certificate,
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
