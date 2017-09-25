"use strict";
const Homey = require('homey');

const globalVarMQTT = require("./global.js");
const brokerMQTT    = require("./broker.js");

class MQTTBrokerApp extends Homey.App {
   onInit() {
      this.logmodule = require("./logmodule.js");
      this.globalVar = new globalVarMQTT(this);
      this.broker = new brokerMQTT(this);
//      this.server = new mosca.Server(settings);
//      this.Run();
   }

/*   Run() {
      this.server.on('clientConnected', function(client) {
          this.logmodule.writelog('info', 'client connected: '+ client.id);
      });


      // fired when a message is received
      this.server.on('published', function(packet, client) {
        this.logmodule.writelog('info', 'Published '+ packet.payload);
      });

      this.server.on('ready', function() {
         this.logmodule.writelog('info', 'Mosca server is up and running');
      });

      // fired when the mqtt server is ready
   }*/

   changedSettings(args) {
      this.logmodule.writelog("changedSettings called");
      this.logmodule.writelog(args.body);

      // restart broker to listen on different port number
      this.broker.restartBroker();
      return true;
   }

   getLogLines() {
      return this.logmodule.getLogLines();
   }
   addNewUser(args) {
      return this.globalVar.addNewUser(args);
   }

   deleteUser(args) {
      return this.globalVar.deleteUser(args);
   }

   purgeUserData(args) {
      return this.globalVar.purgeUserData(args);
   }
   /*
      getUserArray: Getter for returning the user array to settings.
   */
   getUserArray() {
      return this.globalVar.getUserArray();
   }
   
   startBroker(args) {
      return this.broker.startBroker();
   }
   
   stopBroker(args) {
      return this.broker.stopBroker();
   }
   
   isBrokerRunning() {
      return this.broker.isBrokerRunning();
   }
}
module.exports = MQTTBrokerApp;

