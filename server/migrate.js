var app = require('./server');
var ds = app.dataSources.postgresql;
var appModels = ['Account', 'Proposal', 'ApplicationCredential', 'UserCredential', 'UserIdentity'];

ds.isActual(appModels, function(err, actual) {
  if (!actual) {
    ds.autoupdate(appModels, function(err) {
      if (err){
        throw (err);
      }
      console.log('autoupdate done!')
      process.exit(0);
    });
  }
});
