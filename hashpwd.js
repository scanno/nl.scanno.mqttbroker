'use strict';

var crypto = require('crypto');
var logmodule = require('./logmodule.js');
var iterations = 10000;

module.exports = {
   hashPassword: function(password, salt) {
    return hashPassword(password, salt);
   },
   machPasswords: function(Password, hashedPassword) {
      return machPasswords(Password, hashedPassword);
   }
}

function hashPassword(password, salt) {
  if (salt === undefined || salt === null) {
     salt = crypto.randomBytes(256);
  } else {
     if(typeof salt === 'string') {
			   	salt = new Buffer(salt, 'hex');
  		 }
	 }
  const key = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha1');
  var res = 'pbkdf2$' + iterations +
        '$' + key.toString('hex') +
        '$' + salt.toString('hex');
  return res;
}

function machPasswords(Password, hashedPassword) {
  if (hashedPassword === undefined) {
     return false;
  }
  
  var key = hashedPassword.split('$');
  if(key.length !== 4 || !key[2] || !key[3]) {
    logmodule.writelog('debug',"Password not formatted correctly")
    return false;
  }

  if(key[0] !== 'pbkdf2' || key[1] !== iterations.toString()) {
    logmodule.writelog('debug', 'Wrong algorithm and/or iterations');
    return false;
  }
  var newHash = hashPassword(Password, key[3]);
  logmodule.writelog('debug', "newHash: "+newHash);
  logmodule.writelog('debug', "orgHash: "+hashedPassword);
  if (newHash === hashedPassword) {
    return true
  } else {
    return false;
  }
}
