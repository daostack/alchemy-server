var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

module.exports = function(Account) {

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
        next(new Error('Must include valid signature to update your account profile.'))
      }
    }
  });

};
