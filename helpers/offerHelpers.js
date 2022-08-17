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
  deleteCoupon: (cId) => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.COUPONS)
         .deleteOne({ _id:objectId(cId) })
        resolve(coupons)
        
    });
    },
  
  applyCoupons: (cId,userId) => {
    return new Promise(async(resolve, reject) => {
     let coupons = await db
       .get()
       .collection(collection.COUPONS)
        .find({ code: cId }).toArray()
        let date = new Date();
        let expdate = new Date(coupons[0].expiry);
        

      
    });
  },
};
