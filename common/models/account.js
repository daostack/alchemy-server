'use strict';

var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

module.exports = function(Account) {

  Account.getAddressNonce = async function(address, cb) {
    let account = await Account.findOne({ where: { address } });
    if (!account) {
      account = new Account();
      account.ethereumAccountAddress = address;
    }
    if (!account.loginNonce) {
      account.loginNonce = Math.floor(Math.random() * 1000000);
      account.save({ skipSignatureCheck: true });
    }
    return account.loginNonce;
  };

  Account.remoteMethod(
    'getNonce', {
      http: {
        path: '/getNonce',
        verb: 'get',
      },
      accepts: {
        arg: 'address',
        type: 'string',
      },
      returns: {
        arg: 'nonce',
        type: 'string',
      },
    }
  );

  Account.login = function(address, signature, cb) {
    Account.findOne({ where: { address } }, (err, instance) => {
      if (instance) {
        cb(null, "Success!");
      } else {
        cb("Broken");
      }
    });
  };

  Account.remoteMethod(
    'login', {
      http: {
        path: '/login',
        verb: 'post',
      },
      accepts: {
        arg: 'address',
        type: 'string',
      },
      returns: {
        arg: 'nonce',
        type: 'string',
      },
    }
  );

  Account.observe('before save', function(ctx, next) {
    if (ctx.options.skipSignatureCheck) {
      next();
    } else {
      const data = ctx.instance ? ctx.instance : ctx.data;

      // Check that timestamp is within the last 10 minutes
      const timestamp = parseInt(data.timestamp);
      const now = new Date().getTime();
      if (now - timestamp > 10 * 60 * 1000) {
        next(new Error('Invalid signature'));
        return;
      }

      const text = "Please sign this message to confirm your request to update your profile to name '" + data.name + "' and description '" + data.description + "'. There's no gas cost to you. Timestamp:" + data.timestamp;
      const msg = ethUtil.bufferToHex(Buffer.from(text, 'utf8'));
      const recoveredAddress = sigUtil.recoverPersonalSignature({ data: msg, sig: data.signature });

      if (recoveredAddress == data.ethereumAccountAddress) {
        next();
      } else {
        next(new Error('Must include valid signature to update your account profile.'));
      }
    }
  });

};
