"use strict";
const Homey = require('homey');

const globalVarMQTT = require("./global.js");
const brokerMQTT    = require("./broker.js");
const logMQTT       = require("./logmodule.js");

class MQTTBrokerApp extends Homey.App {
   onInit() {
      this.Homey = Homey;
      this.logmodule = new logMQTT(this);
      this.globalVar = new globalVarMQTT(this);
      this.broker = new brokerMQTT(this);
   }

   changedSettings(body) {
      this.logmodule.writelog('info',"changedSettings called");
      this.logmodule.writelog('debug', body);
      this.logmodule.setDebugState();

      this.broker.stopBroker();

      if (this.broker.getConnectOptions()) {
         this.logmodule.writelog('info',"Settings checked OK");
         // restart broker to listen on different port number
         this.broker.startBroker();
         return true;
      }
      return false;
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

   generateSelfSignedCerts(body) {
      this.logmodule.writelog('debug', "generateSelfSignedCerts called in app.js");
      this.logmodule.writelog('debug', JSON.stringify(body));
      const selfsigned = require("selfsigned");

      var attrs = [{ name: 'commonName', value: body.commonname }];
      var pems = selfsigned.generate(attrs, { days: body.daysvalid });

      return pems;
   }
   saveX509Certs(args) {
      this.broker.writeX509Data(args);
   }

   readX509Certs() {
      return this.broker.readX509Data();
   }

}
module.exports = MQTTBrokerApp;
