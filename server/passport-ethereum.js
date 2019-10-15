'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport-strategy');
var util = require('util');
var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

function lookup(obj, field) {
  if (!obj) { return null; }
  var chain = field.split(']').join('').split('[');
  for (var i = 0, len = chain.length; i < len; i++) {
    var prop = obj[chain[i]];
    if (typeof(prop) === 'undefined') { return null; }
    if (typeof(prop) !== 'object') { return prop; }
    obj = prop;
  }
  return null;
};

/**
 * `Strategy` constructor.
 *
 * The local authentication strategy authenticates requests based on the
 * credentials submitted through an HTML-based login form.
 *
 * Applications must supply a `verify` callback which accepts `username` and
 * `password` credentials, and then calls the `done` callback supplying a
 * `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occured, `err` should be set.
 *
 * Optionally, `options` can be used to change the fields in which the
 * credentials are found.
 *
 * Options:
 *   - `usernameField`  field name where the username is found, defaults to _username_
 *   - `passwordField`  field name where the password is found, defaults to _password_
 *   - `passReqToCallback`  when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Examples:
 *
 *     passport.use(new LocalStrategy(
 *       function(username, password, done) {
 *         User.findOne({ username: username, password: password }, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, postVerifyGetInfo) {
  if (typeof options == 'function') {
    postVerifyGetInfo = options;
    options = {};
  }
  //if (!postVerifyInfo) { throw new TypeError('LocalStrategy requires a verify callback'); }

  if (options == null) {
    options = {};
  }

  if (postVerifyGetInfo) {
    this._postVerifyGetInfo = postVerifyGetInfo;
  }

  this._nonceField = options.nonceField || 'nonce';
  this._addressField = options.addressField || 'address';
  this._signatureField = options.signatureField || 'signature';
  this._sessionID = options.sessionID || 'sessionID';

  passport.Strategy.call(this);
  this.name = 'ethereum';
  this._passReqToCallback = options.passReqToCallback;
  this._nonce = {};
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);

/**
 * Set the session based nonce for this authentication request.
 *
 * @param {String} sessionId
 * @param {String} nonce
 * @api protected
 */
Strategy.prototype.setnonce = function(sessionID, nonce) {
  this._nonce[sessionID] = nonce;
};

/**
 * Delete the session based nonce for this authentication request.
 *
 * @param {String} sessionId
 * @api protected
 */
Strategy.prototype.deletenonce = function(sessionID) {
  delete this._nonce[sessionID];
};

/**
 * Authenticate request based on the contents of a form submission.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  options = options || {};
  var nonce = lookup(req.body, this._nonceField) || lookup(req.query, this._nonceField);
  var address = lookup(req.body, this._addressField) || lookup(req.query, this._addressField);
  var signature = lookup(req.body, this._signatureField) || lookup(req.query, this._signatureField);
  var sessionID = req.sessionID;

  if (!nonce || !address || !signature) {
    return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
  }

  var self = this;

  if (!sessionID && !self._passReqToCallback) {
    return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
  }

  // TODO: is this the right place to do this?
  this.setnonce(sessionID, nonce);

  function verified(err, user, info) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(info); }
    self.success(user, info);
  }

  try {
    if (self._passReqToCallback) {
      this.verify(req, sessionID, nonce, address, signature, verified);
    } else {
      this.verify(sessionID, nonce, address, signature, verified);
    }
  } catch (ex) {
    return self.error(ex);
  }
};

/**
 * Verify the signature and the nonce against the session.
 *
 * @param {Object} req
 * @param {String} payload
 * @param {String} signature
 * @param {Function} verified
 * @api protected
 */
Strategy.prototype.verify = function(req, session, nonce, address, signature, verified) {
  var sessionID;
  if (typeof session == 'Object') {
    sessionID = session.id;
  } else {
    sessionID = session;
  }

  if (nonce != this._nonce[sessionID]) {
    verified(null, null, 'The nonce given is not the nonce for this session');
    return;
  }

  var msgToVerify = "Please sign this message to prove your ownership of this account '" +
        address + "'. There's no gas cost to you. " + nonce;
  msgToVerify = ethUtil.bufferToHex(Buffer.from(msgToVerify, 'utf8'));
  var returnAddress = sigUtil.recoverPersonalSignature({ 'data': msgToVerify, 'sig': signature });

  if (returnAddress != address) {
    verified(null, null, 'The address did not match the signature');
    return;
  }

  if (this._postVerifyGetInfo) {
    this._postVerifyGetInfo(req, address, verified);
  } else {
    verified(null, address, 'Authentication successful');
  }
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
