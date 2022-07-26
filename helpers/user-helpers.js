var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      let phone = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ phone: userData.phone });

      if (email) {
        console.log("same email");
        response.status = true;
        resolve(response);
      } else if (phone) {
        console.log("same phone number");
        response.phone = true;
        resolve(response);
      } else {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
        console.log("no same email");
        resolve({ status: false });
      }
    });
  },
  
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      console.log(user)
      if (user) {
         if (user.block == true) {
           resolve({ userBlock: true });
         }
      }
     
      
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login faild");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login faild");
        resolve({ status: false });
      }
    });
  },

  //user checking

  isExist: (isuser) => {
    var user = { ...isuser.user };
    async function nameGetter(user) {
      let email = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: user.Email });
      var Uemail = { ...email };
      if (Uemail.Email !== user.Email) {
        isuser.destroy();
      }
    }
    nameGetter(user);
  },

  //USER NUMBER CHECKING

  NumberExist: (number) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: number });
        
      if (user == null) {
         console.log("login faild");
         resolve({ userExist: false,});
      } else {
         if (user.block == true) {
           resolve({ userBlock: true });
           console.log("login faild");
           resolve({ status: false });
         } else if (user !== null) {
    
            resolve( user);
         } 
      }
    });
  },




  blockUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            // Update document
            $set: { block: true },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  unBlockUser: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            // Update document
            $set: { block: false },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
};
