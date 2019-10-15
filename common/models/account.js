'use strict';

var ethUtil = require('ethereumjs-util');
var sigUtil = require('eth-sig-util');

module.exports = function(Account) {

  Account.getAddressNonce = async function(address, cb) {
    let account = await Account.findOne({ where: { ethereumAccountAddress: address } });
    if (!account) {
      account = new Account();
      account.ethereumAccountAddress = address;
    }

    // Always generate a new nonce so each login is unique
    account.loginNonce = Math.floor(Math.random() * 1000000);
    account.save();
    return account.loginNonce;
  };

};
