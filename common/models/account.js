var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

module.exports = function(Account) {

  Account.observe('before save', function(ctx, next) {
    const text = "Please sign this message to confirm your request to update your profile to name '" + ctx.instance.name + "' and description '" + ctx.instance.description + "'. There's no gas cost to you. [" + ctx.instance.timestamp + "]";
    const msg = ethUtil.bufferToHex(Buffer.from(text, 'utf8'));
    const recoveredAddress = sigUtil.recoverPersonalSignature({ data: msg, sig: ctx.instance.signature });

    if (recoveredAddress == ctx.instance.ethereumAccountAddress) {
      next();
    } else {
      next(new Error('Must include valid signature to update your account profile.'))
    }
  });

};
