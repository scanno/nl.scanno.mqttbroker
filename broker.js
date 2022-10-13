
var aedes;

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
      this.certificate = {};
      this.logmodule = app.logmodule;
      logmodule1 = this.logmodule;
      this.globalVar = app.globalVar;
      globalVar1 = this.globalVar;
      this.server = null;
      this.serverTLS = null;
      this.serverOnline = false;
      this.serverRestart = false;
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
      var iPort = parseInt(this.Homey.ManagerSettings.get('ip_port'));
      var iPortTLS = parseInt(this.Homey.ManagerSettings.get('ip_port_tls'));
      var bKeyFileValid = false;
      var bCertFileValid = false;

      this.brokerSettings = {};
      this.brokerSettings.secure = {};
      this.brokerSettings.secure.enabled = false;
      this.certificate = {};

      if (this.Homey.ManagerSettings.get('tls') == true) {
         bTLS = true;
      }
      if (this.Homey.ManagerSettings.get('allow_nonsecure') == true) {
        bAllowNonSecure = true;
      }

      // Check if key and certificate files are created
      if (bTLS === true && iPortTLS > 1000 && iPortTLS !== iPort) {
         this.logmodule.writelog('debug', "Check if key and cert PEM files are available");
         var fs = require('fs');
         if (fs.existsSync(SECURE_PRIVATEKEY)) {
            this.logmodule.writelog('debug', "Key file found");
            var privstats=fs.statSync(SECURE_PRIVATEKEY);
            this.logmodule.writelog('debug', "PRIVKEY size = " + privstats.size);
            if (privstats.size > 256){
                bKeyFileValid = true;
                this.certificate.key = fs.readFileSync(SECURE_PRIVATEKEY);
            }
         }
         if (fs.existsSync(SECURE_CERT)) {
            this.logmodule.writelog('debug', "Cert file found");
            var certstats = fs.statSync(SECURE_CERT);
            this.logmodule.writelog('debug', "CERT size = " + certstats.size);
            if (certstats.size > 256) {
                bCertFileValid = true;
                this.certificate.cert = fs.readFileSync(SECURE_CERT);
            }
         }
         if (bKeyFileValid === true && bCertFileValid === true) {
            this.logmodule.writelog('debug', "TLS Config seems valid");
            bConfigValid = true;
         }
      }

      if ((bTLS === false || bAllowNonSecure === true) && iPort > 1000) {
         // Check if we have a combined secure and non secure port. If we do, then the secure
         // config should be valid.
         if (bTLS === true && bConfigValid === false) {
           this.logmodule.writelog('error', "broker: TLS config is not valid.");
           return false;
         }
         this.logmodule.writelog('debug', "PLAIN Config seems valid");
         bConfigValid = true;
      }

      // Create the config struct
      if (bConfigValid === true) {
         if (bTLS === true) {
            this.brokerSettings.secure.enabled = true;
            this.brokerSettings.secure.port = iPortTLS;
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
      this.logmodule.writelog('error', "broker: Config is not valid.");
      return false;
   }

   startBroker() {
      var ref = this;
      if (this.serverOnline == false && this.getConnectOptions() == true) {
         this.logmodule.writelog('info', "Starting broker...");
         this.logmodule.writelog('info', "brokerSettings: " + JSON.stringify(this.brokerSettings));
         try {
            var NedbPersistence = require('aedes-persistence-nedb');
            var db = new NedbPersistence({
               path: '/userdata',
               prefix: 'mqtt'
            });
            aedes = require('aedes') ();
            aedes.persistance = db;
            aedes.authenticate = this.authUser;
            this.brokerEvents();
            if (this.brokerSettings.secure.enabled) {
               this.serverTLS = require('tls').createServer(this.certificate, aedes.handle);
               this.serverTLS.listen(this.brokerSettings.secure.port, function() {
                  ref.logmodule.writelog('info', 'Aedes MQTTS server is up and running');
                  ref.serverOnline = true;
               });
            }
            if (this.brokerSettings.allowNonSecure || !this.brokerSettings.secure.enabled) {
               this.server = require('net').createServer(aedes.handle);
               this.server.listen(this.brokerSettings.port, function() {
                  ref.logmodule.writelog('info', 'Aedes MQTT server is up and running');
                  ref.serverOnline = true;
               });
            }
         } catch(err) {
           this.logmodule.writelog('error', "startBroker(): " +err);
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
         if (this.brokerSettings.allowNonSecure || !this.brokerSettings.secure.enabled) {
            ref.server.close();
            ref.logmodule.writelog('info', 'Aedes MQTT server is stopped');
         }
         
         if (this.brokerSettings.secure.enabled) {
            ref.serverTLS.close();
            ref.logmodule.writelog('info', 'Aedes MQTTS server is stopped');
         }
         aedes.close();
      }
   }

   restartBroker() {
      var ref = this;
      this.logmodule.writelog('info', "Restarting broker...");
      if (this.serverOnline === true) {
         if (this.brokerSettings.allowNonSecure || !this.brokerSettings.secure.enabled) {
            ref.server.close();
            ref.logmodule.writelog('info', 'Aedes MQTT server is stopped');
         }
         if (this.brokerSettings.secure.enabled) {
            ref.serverTLS.close();
            ref.logmodule.writelog('info', 'Aedes MQTTS server is stopped');
         }
         aedes.close();
         ref.serverRestart = true;
      } else {
         ref.startBroker();
      }
   }

   isBrokerRunning() {
      return this.serverOnline;
   }

   brokerEvents() {
      var ref = this;
      // when a client is connected; the client is passed as a parameter
      aedes.on('client', function(client) {
          ref.logmodule.writelog('info', 'client connected: '+ client.id);
      });

      // when a client is disconnected; the client is passed as a parameter.
      aedes.on('clientDisconnect', function(client) {
          ref.logmodule.writelog('info', 'client disconnected: '+ client.id);
      });

      // when a new message is published; the packet and the client are passed as parameters.
      aedes.on('publish', function(packet, client) {
         ref.logmodule.writelog('info', 'Packet published '+ packet.payload);
      });

      //  when a client is subscribed to a topic; the topic and the client are passed as parameters.
      aedes.on('subscribe', function(topic, client) {
         ref.logmodule.writelog('info', client.id + ' has subscribed to topic '+ JSON.stringify(topic));
      });

      //  when a client is unsubscribed to a topic; the topic and the client are passed as parameters.
      aedes.on('unsubscribe', function(topic, client) {
         ref.logmodule.writelog('info', client.id + ' has unsubscribed from topic '+ JSON.stringify(topic));
      });
      aedes.on('closed', function() {
         ref.logmodule.writelog('info', 'Server is closed');
         ref.serverOnline = false;
         if (ref.serverRestart) {
            ref.serverRestart = false;
            ref.startBroker();
         }
      });

      aedes.on('uncaughtException', function(err) {
         if (err.errno === 'EADDRINUSE') {
            ref.logmodule.writelog('info', 'The port is already in use');
         }
      });
   }

   // Accepts the connection if the username and password are valid
   authUser(client, username, password, callback) {
      logmodule1.writelog('info',"User authentication for user " + username);
      if (globHomey.ManagerSettings.get('disable_auth') == false) {
         if (username !== null) {
            var userCheck = globalVar1.getUser(username);
            if (userCheck !== null) {
               var authorized = false;
               if (username === userCheck.userName) {
                 if (globHomey.ManagerSettings.get('disable_hashing') == false) {
                     if (hashpwd.machPasswords(password, globalVar1.getUser(username).userPassword)) {
                        authorized = true;
                        logmodule1.writelog('info', 'User '+username+' has been succesfully authenticated');
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
         logmodule1.writelog('info', 'User '+username+' is allowed but not checked');
         callback(null,true);
      }
   }

   // In this case the client authorized as alice can publish to /users/alice taking
   // the username from the topic and verifing it is the same of the authorized user
   authPublish(client, topic, payload, callback) {
      // right now no check for topic ACL
      callback(null);
   }

   // In this case the client authorized as alice can subscribe to /users/alice taking
   // the username from the topic and verifing it is the same of the authorized user
   authSubscribe(client, topic, callback) {
      // right now now check for topic ACL
      callback(null);
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
