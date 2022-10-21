const Homey = require('homey');

module.exports = {
   async updateSettings({ homey, params, body}) {
      console.log("API: Incoming POST on /test/settingschange/");
      const result = await homey.app.changedSettings(body);
      return result
   },

   async getUserArray({ homey, query}) {
      const result = homey.app.getUserArray();
      return result;
   },

   async purgeUserData({ homey, query }) {
      const result = homey.app.purgeUserData(query);
      return result;
   },

   async addNewUser({ homey, params, body}) {
      const result = await homey.app.addNewUser(body);
      return result;
   },

   async deleteUser({ homey, params, body }) {
      const result = await homey.app.deleteUser(body);
      return result;
   },

   async startBroker({ homey, params, body }) {
      console.log("API: Incoming POST on /settings/startBroker/");
      const result = await homey.app.startBroker(body);
      return result;
   },

   async stopBroker({ homey, params, body }) {
      console.log("API: Incoming POST on /settings/stopBroker/");
      const result = await homey.app.stopBroker(body);
      return result;
   },

   async isBrokerRunning({homey, query}) {
      const result = homey.app.isBrokerRunning();
      return result;
   },

   async generateSelfSignedCerts({ homey, params, body }) {
      const result = await homey.app.generateSelfSignedCerts(body);
      return result;
   },

   async saveX509Certs({homey, params, body}) {
      const result = await homey.app.saveX509Certs(body);
      return result;
   },

   async readX509Certs({homey, query}) {
      const result = homey.app.readX509Certs();
      return result;
   },

   async getloglines({ homey, query }) {
      console.log("API: Incoming POST on /test/getloglines/");
      const result = homey.app.getLogLines(query);
      return result;
   },

   async info({ homey, query }) {
      const result = {
         port: Number(homey.settings.get('ip_port') || 1883),
         tls: !!homey.settings.get('tls'),
         port_tls: Number(homey.settings.get('ip_port_tls') || 8883),
         allow_nonsecure: !!homey.settings.get('allow_nonsecure'),
      };
      return result;
   },

   async user({ homey, params, body}) {
      const result = await homey.app.addNewUser(body);
      return result;
   }
};
