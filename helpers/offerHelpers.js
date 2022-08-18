var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addCoupons: (coupon) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.COUPONS)
          .insertOne(coupon).then((data) => {
            resolve(data)
        })
    });
  },
  getCoupons: () => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.COUPONS)
            .find().toArray()
        resolve(coupons);
        
    });
  },
  checkCoupons: (cId) => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.COUPONS)
            .find({code:cId}).toArray()
        resolve(coupons);
        
    });
  },

  deleteCoupon: (cId) => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.COUPONS)
         .deleteOne({ _id:objectId(cId) })
        resolve(coupons)
        
    });
    },
  
  applyCoupons: async (cId, userId) => {

    let check = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find({
        _id: objectId(userId),
        usedCoupon: { $in: [cId] },
      }).toArray()
    console.log(check.length,"oooooooohoooooooiiii......");
    if (check.length === 0) {
      let response = {};
      return new Promise(async (resolve, reject) => {
        let coupons = await db
          .get()
          .collection(collection.COUPONS)
          .find({ code: cId }).toArray()
        let date = new Date();
        let starting = new Date(coupons[0].starting);
        let ending = new Date(coupons[0].ending);
        if (date <= ending || date >= starting) {
          coupons[0].cExist = true;
          db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
            { $set: { coupon: cId, couponDiscount: coupons[0].percentage } }, { upsert: true }).then((data) => {
              console.log(data);
            })
          resolve(coupons)
        }
       
      })
    } else {
      return {coupon:"already used coupon"}
    }
  },
};
