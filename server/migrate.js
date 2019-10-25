'use strict';

var app = require('./server');
var ds = app.dataSources.postgresql;
var appModels = ['Account', 'Proposal', 'ApplicationCredential', 'UserCredential', 'UserIdentity'];

ds.isActual(appModels, function(err, actual) {
  if (actual) {
    console.log('No migration needed');
    ds.disconnect();
    process.exit(0);
  } else {
    ds.autoupdate(appModels, function(err) {
      if (err) {
        throw (err);
      }
      console.log('autoupdate done!');
      ds.disconnect();
      process.exit(0);
    });
  }
});
