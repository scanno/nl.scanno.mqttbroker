"use strict";

var hashpwd = require("./hashpwd.js");

class globalVars {

   constructor(app) {
      this.userArray = [];

      //this.Homey     = require("homey");
      this.Homey = app.homey;
      this.logmodule = app.logmodule;

      this.OnInit();
   }

   OnInit() {
      this.initVars();
   }

   /*
      initVars() is called as soon as the app is loaded and it will
      initialise the unload event that will persist the userArray and fenceArray
      It also loads the userArray and fenceArray from file and puts them in the
      array.
   */
   initVars() {
      const ref = this;

      this.logmodule.writelog('debug', "initVars called");

      require('fs').readFile('/userdata/broker-users.json', 'utf8', function (err, data) {
         if (err) {
            ref.logmodule.writelog('error', "Retreiving broker data failed: "+ err);
         } else {
            try {
                ref.userArray = JSON.parse(data);
            } catch (err) {
               ref.logmodule.writelog('error', "Parsing broker data failed: "+ err);
               ref.userArray = [];
            }
         }
      });
   }

   /*
      saveUserData() saves the user data into a JSON file on the filesystem
   */
   saveUserData() {
      const ref = this;
      this.logmodule.writelog('info', "saveUserData called");
      require('fs').writeFile("/userdata/broker-users.json",  JSON.stringify(this.userArray), function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting brokerArray failed: "+ err);
         }
      });
   }

   /*
      deletePersistancyFiles() deletes the saved arrays from the filesystem. This
      can be used when the persistency files were borked.
   */
   deletePresistancyFiles() {
      const ref = this;
      var returnValue = false;

      try {
         require('fs').unlinkSync('/userdata/broker-users.json');
      } catch(err) {
            ref.logmodule.writelog('error', err);
            returnValue = true;
      }

      return returnValue;
   }

   /*
      Return the userArray
   */
   getUserArray() {
      this.logmodule.writelog('debug', "getUserArray called");
      return this.userArray;
   }

   /*
      Return the data for the given user
   */
   getUser(userName) {
      for (var i=0; i < this.userArray.length; i++) {
         if (this.userArray[i].userName === userName) {
            return this.userArray[i];
         }
      }
      // User has not been found, so return null
      return null
   }


   /*
      Update the user, or if the user does not exist, add the user
      to the user array
   */
   setUser(userData, persistUser) {
      const ref = this;
      try {
         var entryArray = ref.getUser(userData.userName);

         if (entryArray !== null) {
            entryArray = userData;
         } else {
            // User has not been found, so assume this is a new user
            ref.userArray.push(userData);

            ref.Homey.notifications.registerNotification({
               excerpt: ref.Homey.__("notifications.user_added", {"name": userData.userName})
            }, function( err, notification ) {
               if( err ) return console.error( err );
                  console.log( 'Notification added' );
            });
         }
         if (persistUser == true) {
            ref.saveUserData();
         }
      } catch(err) {
         ref.logmodule.writelog('error', "setUser: " +err);
      }
   }

   /*
      Create a password hash
   */
   hashedPassword(userPassword) {
     var ref = this;
     var hashedPassword = hashpwd.hashPassword(userPassword);
     this.logmodule.writelog('debug', "hashedPassword: "+hashedPassword);
     return hashedPassword;
   }

   createEmptyUser(userName, userPassword) {
      try {
         var newUser = {};
         newUser.userName = userName;
         if (this.Homey.settings.get('disable_hashing') == false ) {
            newUser.userPassword = this.hashedPassword(userPassword);
         } else {
           newUser.userPassword = userPassword;
         }
         return newUser;
      } catch(err) {
         this.logmodule.writelog('error', "createEmptyUser: " +err);
         return null;
      }
   }

   /*
      addNewUser is called from the settings page when a new user is added
      or when the token needs to be refreshed.
   */
   addNewUser(body) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "New user called: "+ body.userName);
         if (body.userName !== null && body.userName !== undefined && body.userName !== "" ) {
            var currentUser = ref.getUser(body.userName);
            if (currentUser == null) {
               var newUser = ref.createEmptyUser(body.userName, body.userPassword);
               ref.setUser(newUser, true);
               ref.logmodule.writelog('info', "New user added: "+ newUser.userName);
              return true;
            } else {
               if (this.homey.settings.get('disable_hashing') == false ) {
                 currentUser.userPassword = this.hashedPassword(body.userPassword);
               } else {
                 currentUser.userPassword = body.userPassword;
               }
               ref.logmodule.writelog('debug', "userPassword: " + currentUser.userPassword);
               ref.saveUserData();
            }
         }
         return false;
      } catch(err) {
         ref.logmodule.writelog('error', "addNewUser: " +err);
         return err;
      }
   }

   /*
      deleteUser is called from the settings page when a user is deleted
      by pressing the - button
   */
   deleteUser(body) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "Delete user called: "+ body.userName);
         var result = false;
         for (var i=0; i < ref.userArray.length; i++) {
            if (ref.userArray[i].userName === body.userName) {
               var deletedUser = ref.userArray.splice(i, 1);
               ref.logmodule.writelog('info', "Deleted user: " + deletedUser.userName);
               result = true;
            }
         }
         ref.saveUserData();
         return result;
      } catch(err) {
         logmodule.writelog('error', "deleteUser: " +err);
         return err;
      }
   }


}
module.exports = globalVars;
