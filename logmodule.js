class Logger {
  constructor(app) {
    this.logArray = [];
    this.Homey = app.homey;
    this.DEBUG = false;
    this.OnInit();
  }

  OnInit() {
    this.setDebugState();
  }

  setDebugState() {
    if (this.Homey.settings.get('set_debug') == true) {
      this.DEBUG = true;
    } else {
      this.DEBUG = false;
    }
  }

  getDateTime() {
      var date = new Date();
      var hour = date.getHours();
      hour = (hour < 10 ? "0" : "") + hour;

      var min  = date.getMinutes();
      min = (min < 10 ? "0" : "") + min;

      var sec  = date.getSeconds();
      sec = (sec < 10 ? "0" : "") + sec;

      var year = date.getFullYear();

      var month = date.getMonth() + 1;
      month = (month < 10 ? "0" : "") + month;

      var day  = date.getDate();
      day = (day < 10 ? "0" : "") + day;

      return year + month + day + "-" + hour + ":" + min + ":" + sec;
  }

  writelog(level, line) {
     switch(level) {
        case 'error':
           this.Homey.notifications.createNotification({
              excerpt: line
           }, function( err, notification ) {
              if( err ) return console.error( err );
           });
        case 'debug':
           if (this.DEBUG == false) break;
        case 'info':
           var logLine = this.getDateTime() + "   " + line;
           console.log( logLine );

           if (this.logArray.length >= 50) {
              this.logArray.shift();
           }
           this.logArray.push(logLine);
           break;
     }
  }

  getLogLines() {
     this.writelog('debug', "getLogLines called");
     return this.logArray;
  }
}
module.exports = Logger;
