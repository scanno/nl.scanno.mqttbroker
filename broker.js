//const Homey     = require('homey');

const mosca     = require('mosca');
var globalVar1  = null;

class brokerMQTT {

   constructor(app) {
      this.brokerSettings = {};
      this.logmodule = app.logmodule;
      this.globalVar = app.globalVar;
      globalVar1 = this.globalVar;
      this.server = null;
      this.serverOnline = false;
      this.Homey = require('homey');
      this.OnInit();
   }

   OnInit() {
//      if (this.getConnectOptions() === true) {
      this.startBroker();
//         this.brokerEvents();
//      }
   }

   getConnectOptions() {
      if (this.Homey.ManagerSettings.get('ip_port') > 0) {
         this.brokerSettings = {
            port: parseInt(this.Homey.ManagerSettings.get('ip_port'), 10)
         };
         return true;
      }
      return false;
   }

   startBroker() {
      if (this.serverOnline == false && this.getConnectOptions() == true) {
         this.logmodule.writelog('info', "Starting broker...");
         this.logmodule.writelog('info', "brokerSettings: " + this.brokerSettings);
         this.server = new mosca.Server(this.brokerSettings);
         this.brokerEvents();
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
      if (username !== null) {
         var userCheck = globalVar1.getUser(username);
         if (userCheck !== null) {
            var authorized = (username === userCheck.userName && password.toString() === userCheck.userPassword);
            if (authorized) client.user = username;
            callback(null, authorized);
         } else {
            callback(null, false);
         }
      } else {
         callback(null, false);
      }
   }

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
}

module.exports = brokerMQTT;
