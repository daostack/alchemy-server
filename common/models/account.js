module.exports = function(Account) {
  Account.greet = function(msg, cb) {
    process.nextTick(function() {
      msg = msg || 'hello';
      cb(null, 'Sender says ' + msg + ' to receiver');
    });
  };
};
