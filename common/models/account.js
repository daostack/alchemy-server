var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

module.exports = function(Account) {

  Account.observe('before save', function(ctx, next) {
    // Check that timestamp is within the last 10 minutes
    const timestamp = parseInt(ctx.instance.timestamp);
    const now = new Date().getTime();
    console.log((now - timestamp) / 1000);
    if (now - timestamp > 10 * 60 * 1000) {
      next(new Error('Invalid signature'));
      return;
    }

    const text = "Please sign this message to confirm your request to update your profile to name '" + ctx.instance.name + "' and description '" + ctx.instance.description + "'. There's no gas cost to you. Timestamp:" + ctx.instance.timestamp;
    const msg = ethUtil.bufferToHex(Buffer.from(text, 'utf8'));
    const recoveredAddress = sigUtil.recoverPersonalSignature({ data: msg, sig: ctx.instance.signature });

    if (recoveredAddress == ctx.instance.ethereumAccountAddress) {
      next();
    } else {
      next(new Error('Must include valid signature to update your account profile.'))
    }
  });

};
