const Homey = require('homey');

module.exports = [{
   description:	'Notify on settings changed',
   method:      'POST',
   path:        '/test/settingschange/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      console.log("API: Incoming POST on /settings/settingschange/");
      var result = Homey.app.changedSettings(args);
      if( result instanceof Error ) callback( result );
      callback( null, result );
   }
},
{
   description:	'Get Array with user info',
   method:      'GET',
   path:        '/settings/getUserArray/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.getUserArray();
      callback(null, result);
   }
},
{
   description:	'Purge userdata',
   method:      'GET',
   path:        '/settings/purgeUserData/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.purgeUserData(args);
      callback(null, result);
   }
},
{
   description:	'Add new User',
   method:      'POST',
   path:        '/settings/addNewUser/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      result = Homey.app.addNewUser(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Delete User',
   method:      'POST',
   path:        '/settings/deleteUser/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.deleteUser(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Start Broker',
   method:      'POST',
   path:        '/settings/startBroker/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.startBroker(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Stop Broker',
   method:      'POST',
   path:        '/settings/stopBroker/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.stopBroker(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Get Broker status',
   method:      'GET',
   path:        '/settings/isBrokerRunning/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.isBrokerRunning();
      callback(null, result);
   }
},
{
   description:	'Show latst 10 loglines',
   method:      'GET',
   path:        '/settings/getloglines/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      console.log("API: Incoming POST on /test/getloglines/");
      var result = Homey.app.getLogLines(args);
      callback(null, result);
   }

}]




