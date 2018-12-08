
const mosca     = require('mosca/node_modules/mosca');
var hashpwd = require("./hashpwd.js");
var globalVar1  = null;
var logmodule1 = null;
var globHomey = null;

var SECURE_PRIVATEKEY = '/userdata/tls-privkey.pem';
var SECURE_PUBLICKEY = '/userdata/tls-pubkey.pem';
var SECURE_CERT = '/userdata/tls-cert.pem';

class brokerMQTT {

   constructor(app) {
      this.brokerSettings = {};
      this.logmodule = app.logmodule;
      logmodule1 = this.logmodule;
      this.globalVar = app.globalVar;
      globalVar1 = this.globalVar;
      this.server = null;
      this.serverOnline = false;
      this.Homey = require('homey');
      globHomey = this.Homey;
      this.OnInit();
   }

   OnInit() {
      this.startBroker();
   }

   getConnectOptions() {
      var bConfigValid = false;
      var bTLS = false;
      var bAllowNonSecure = false;
      var iPort = parseInt(this.Homey.ManagerSettings.get('ip_port'), 10);
      var iPortTLS = parseInt(this.Homey.ManagerSettings.get('ip_port_tls'), 10);
      var bKeyFileValid = false;
      var bCertFileValid = false;

      this.brokerSettings = {};

      if (this.Homey.ManagerSettings.get('tls') == true) {
         bTLS = true;
      }
      if (this.Homey.ManagerSettings.get('allow_nonsecure') == true) {
        bAllowNonSecure = true;
      }

      // Check if key and certificate files are created
      if (bTLS === true && iPortTLS > 1000) {
         this.logmodule.writelog('debug', "Check if key and cert PEM files are available");
         var fs = require('fs');
         if (fs.existsSync(SECURE_PRIVATEKEY)) {
            this.logmodule.writelog('debug', "Key file found");
            bKeyFileValid = true;
         }
         if (fs.existsSync(SECURE_CERT)) {
            this.logmodule.writelog('debug', "Cert file found");
            bCertFileValid = true;
         }
         if (bKeyFileValid === true && bCertFileValid === true) {
            this.logmodule.writelog('debug', "TLS Config seems valid");
            bConfigValid = true;
         }
      }

      if ((bTLS === false || bAllowNonSecure === true) && iPort > 1000) {
         this.logmodule.writelog('debug', "PLAIN Config seems valid");
         bConfigValid = true;
      }

      // Create the config struct
      if (bConfigValid === true) {
         if (bTLS === true) {
            this.brokerSettings.secure = {};
            this.brokerSettings.secure.port = iPortTLS;
            this.brokerSettings.secure.keyPath = SECURE_PRIVATEKEY;
            this.brokerSettings.secure.certPath = SECURE_CERT;
         }
         if (bTLS === false || bAllowNonSecure === true) {
           this.brokerSettings.port = iPort;
           if (bAllowNonSecure === true) {
             // add allowNonSecure here when both http and https should be allowed
             this.brokerSettings.allowNonSecure = true;
           }
         }
         return true;
      }
      return false;
   }

   startBroker() {
      if (this.serverOnline == false && this.getConnectOptions() == true) {
         this.logmodule.writelog('info', "Starting broker...");
         this.logmodule.writelog('info', "brokerSettings: " + JSON.stringify(this.brokerSettings));
         try {
           this.server = new mosca.Server(this.brokerSettings);
         } catch(err) {
           ref.logmodule.writelog('error', "startBroker(): " +err);
           this.brokerEvents();
         }
      } else {
         if (this.serverOnline == true) {
            this.logmodule.writelog('info', "startBroker() was called, but broker is already running.");
         }
      }
   }

   stopBroker() {
      var ref = this;
      if (this.serverOnline !== false) {
         this.server.close(function() {
            ref.logmodule.writelog('info', "Server closed");
            ref.serverOnline = false;
         });
      }
   }

   restartBroker() {
      var ref = this;
      this.logmodule.writelog('info', "Restarting broker...");
      if (this.serverOnline === true) {
         this.server.close(function() {
            ref.logmodule.writelog('info', "Broker closed");
            ref.serverOnline = false;
            ref.startBroker();
         });
      } else {
         ref.startBroker();
      }
   }

   isBrokerRunning() {
/*      if (this.server !== null) {
         return true;
      }
      return false;*/
      return this.serverOnline;
   }

   brokerEvents() {
      var ref = this;
      // when a client is connected; the client is passed as a parameter
      this.server.on('clientConnected', function(client) {
          ref.logmodule.writelog('info', 'client connected: '+ client.id);
      });

      // when a client is being disconnected; the client is passed as a parameter.
      this.server.on('clientDisconnecting', function(client) {
          ref.logmodule.writelog('info', 'client disconnecting: '+ client.id);
      });

      // when a client is disconnected; the client is passed as a parameter.
      this.server.on('clientDisconnected', function(client) {
          ref.logmodule.writelog('info', 'client disconnected: '+ client.id);
      });

      // when a new message is published; the packet and the client are passed as parameters.
      this.server.on('published', function(packet, client) {
        ref.logmodule.writelog('info', 'Packet published '+ packet.payload);
      });

      //  when a client is subscribed to a topic; the topic and the client are passed as parameters.
      this.server.on('subscribed', function(topic, client) {
        ref.logmodule.writelog('info', client.id + ' has subscribed to topic '+ topic);
      });

      //  when a client is unsubscribed to a topic; the topic and the client are passed as parameters.
      this.server.on('unsubscribed', function(topic, client) {
        ref.logmodule.writelog('info', client.id + ' has unsubscribed from topic '+ topic);
      });

      this.server.on('ready', function() {
         ref.logmodule.writelog('info', 'Mosca server is up and running');
         ref.server.authenticate = ref.authUser;
         ref.server.authorizePublish = ref.authPublish;
         ref.server.authorizeSubscribe = ref.authSubscribe;
         ref.serverOnline = true;
      });
   }

   // Accepts the connection if the username and password are valid
   authUser(client, username, password, callback) {
      if (globHomey.ManagerSettings.get('disable_auth') == false) {
         if (username !== null) {
            var userCheck = globalVar1.getUser(username);
            if (userCheck !== null) {
               var authorized = false;
               if (username === userCheck.userName) {
                 if (globHomey.ManagerSettings.get('disable_hashing') == false) {
                     if (hashpwd.machPasswords(password, globalVar1.getUser(username).userPassword)) {
                        authorized = true;
                      }
                 } else {
                   logmodule1.writelog('debug', "plain pwd ("+password +" / "+globalVar1.getUser(username).userPassword+")");
                   if (password ==  globalVar1.getUser(username).userPassword) {
                     logmodule1.writelog('debug',"plain pwd authorized");
                     authorized = true;
                   }
                 }
               }
               if (authorized) client.user = username;
               callback(null, authorized);
            } else {
               callback(null, false);
            }
         } else {
            callback(null, false);
         }
      } else {
        callback(null,true);
      }
   }

   /*
      verifyPassword: Check if the entered password matches the hash
   */
/*   verifyPassword(userPassword, hashedPassword) {
     var password = require('password-hash-and-salt/node_modules/password-hash-and-salt');
     password(userPassword).verifyAgainst(hashedPassword, function(error, verified) {
       if (error) {
         return false;
       }
       if (verified) {
         return true;
       }
       return false;
     });
   } */

   // In this case the client authorized as alice can publish to /users/alice taking
   // the username from the topic and verifing it is the same of the authorized user
   authPublish(client, topic, payload, callback) {
      // right now no check for topic ACL
      callback(null, true);
   }

   // In this case the client authorized as alice can subscribe to /users/alice taking
   // the username from the topic and verifing it is the same of the authorized user
   authSubscribe(client, topic, callback) {
      // right now now check for topic ACL
      callback(null, true);
   }

   // write and read certificate info
   writeX509Data(pemData) {
      this.logmodule.writelog('debug', "writeX509Data called");
      const ref = this;
      require('fs').writeFile(SECURE_PRIVATEKEY, pemData.private, function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting private key failed: "+ err);
         }
      });
      require('fs').writeFile(SECURE_PUBLICKEY, pemData.public, function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting public key failed: "+ err);
         }
      });
      require('fs').writeFile(SECURE_CERT, pemData.cert, function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting cerificate failed: "+ err);
         }
      });
   }

   readX509Data() {
      const ref = this;
      this.logmodule.writelog('debug', "readX509Sata called");
      var privKey = null;
      var pubKey = null;
      var cert = null;

      var fs = require('fs');
      if (fs.existsSync(SECURE_PRIVATEKEY)) {
         privKey = fs.readFileSync(SECURE_PRIVATEKEY).toString();
         ref.logmodule.writelog('debug', "privkey: "+ privKey);
      }

      if (fs.existsSync(SECURE_PUBLICKEY)) {
         pubKey = fs.readFileSync(SECURE_PUBLICKEY).toString();
         ref.logmodule.writelog('debug', "pubkey: "+ pubKey);
      }

      if (fs.existsSync(SECURE_CERT)) {
         cert = fs.readFileSync(SECURE_CERT).toString();
         ref.logmodule.writelog('debug', "cert: "+ cert);
      }

      var pems = {};
      pems.private = privKey;
      pems.public = pubKey;
      pems.cert = cert;

      return pems;
   }
}

module.exports = brokerMQTT;
