var app = require('./server');
var ds = app.dataSources.postgresql;
var appModels = ['Account', 'Proposal', 'ApplicationCredential', 'UserCredential', 'UserIdentity'];

ds.isActual(appModels, function(err, actual) {
  if (!actual) {
    ds.autoupdate(appModels, function(err) {
      if (err){
        throw (err);
      }
      process.exit(0);
    });
  }
  process.exit(0);
});
