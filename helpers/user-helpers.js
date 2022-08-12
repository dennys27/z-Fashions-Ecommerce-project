var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
require("dotenv").config();
 const CC = require("currency-converter-lt");

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

paypal.configure({
  mode: "sandbox",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

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
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ phone: number });

      if (user == null) {
        console.log("login faild");
        resolve({ userExist: false });
      } else {
        if (user.block == true) {
          resolve({ userBlock: true });
          console.log("login faild");
          resolve({ status: false });
        } else if (user !== null) {
          resolve(user);
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

  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((user) => {
          resolve(user);
        });
    });
  },
  // userDefaultAddress: (userId) => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collection.USER_COLLECTION)
  //       .findOne({ _id: objectId(userId) })
  //       .then((user) => {
  //         resolve(user);
  //       });
  //   });
  // },

  updateUser: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      userDetails.newpassword = await bcrypt.hash(userDetails.newpassword, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Password: userDetails.newpassword,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  updatePersonalDetails: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              Email: userDetails.Email,
              userEmail: userDetails.userEmail,
              phone: userDetails.phone,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  updateAddressDetails: (userId, userDetails) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $push: {
              deliveryAddress: userDetails,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  changeOrderStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "cancelled",
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },

  generateRazorPay: (orderId, totalPrice) => {
    return new Promise(async (resolve, reject) => {
      instance.orders.create(
        {
          amount: totalPrice * 100,
          currency: "INR",
          receipt: orderId,
          notes: {
            key1: "value3",
            key2: "value2",
          },
        },
        (err, order) => {
          console.log(err);
          console.log("new order :", order);
          resolve(order);
          if (err) {
            console.log(err);
          }
        }
      );
    });
  },

  deletePending: () => {
    return new Promise(async (resolve, reject) => {
        let Order = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .deleteMany(
            { status: "pending" },
          )
          .then((data) => {
            resolve(data);
          });
     
    })
    },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve({pay:true});
      } else {
        reject({ pay: false });
      }
    });
  },

  // verifyPayment: (details) => {

  //   return new Promise((resolve, reject) => {
  //      console.log("hashed your id............");
  //     const crypto = require("crypto");
  //     let hmac = crypto
  //       .createHmac("sha256", "rzp_test_RwEwJd8bRByvpp")
  //       .update(
  //         details[
  //         "payment[razorpay_order_id]" +
  //         "|" +
  //         details["payment[razorpay_payment_id]"]
  //         ]
  //       );
  //       hmac.digest("hex");
  //     if (hmac == details["payment[razorpay_signature]"]) {
  //       //console.log("hashed your id............")
  //       resolve();
  //     } else {
  //       reject();
  //     }
  //   })
  // },

  changePaymentStatus: (orderId) => {
    // console.log(orderId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  deleteOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .deleteOne({ _id: objectId(orderId) })
        .then((response) => {
          resolve(response);
        });
    });
  }, 

  converter: (price) => {
     return new Promise((resolve, reject) => {
      
         let currencyConverter = new CC({
           from: "INR",
           to: "USD",
           amount: price,
           isDecimalComma: false,
         });
       currencyConverter.convert().then((response) => {
        resolve(response)
       });
       
     });
  },

  generatePayPal: (orderId, totalPrice) => {
    
   
    return new Promise((resolve, reject) => {
      const create_payment_json = {
        intent: "sale",
        payer: { 
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/success",
          cancel_url: "http://localhost:3000/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Red Sox Hat",
                  sku: "001",
                  price: "0",
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: totalPrice,
            },
            description: "Hat for the best team ever",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          resolve(payment);
        }
      });
    });
  },

  deleteAddress: (uniqueId) => {
    let unId = parseFloat(uniqueId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateMany(
          {},
          { $pull: { deliveryAddress: { uId: unId } } },
          { multi: true }
        )
        .then((data) => {
          resolve({ deleted: true });
        });
    });
  },

  addressDefault: (uniqueId,userobjId) => {
   
    let unId = parseFloat(uniqueId);
     console.log(unId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .update(
          { "deliveryAddress.default": true },
          { $set: { "deliveryAddress.$.default": false } })
        .then(() => {

            db.get()
              .collection(collection.USER_COLLECTION)
              .findOneAndUpdate(
                {
                  _id: objectId(userobjId),
                  "deliveryAddress.uId": unId,
                },
                {
                  $set: { "deliveryAddress.$.default": true },
                }
              )
              .then((data) => {
              resolve(data)
              });
       
        
      })
      
    
    });
  },
};

