var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;

module.exports = {
  addCoupons: (coupon) => {
    return new Promise((resolve, reject) => {
      console.log(parseInt(coupon.percentage));
      if (
        parseInt(coupon.percentage) > 10 ||
        parseInt(coupon.percentage < 80)
      ) {
        db.get()
          .collection(collection.COUPONS)
          .insertOne(coupon)
          .then((data) => {
            resolve(data);
          });
      } else {
        console.log("oooooooiiiii, im here......");
        resolve({ warning: true });
      }
      
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
  addOffer: (offer) => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.OFFERS_COLLECTION)
         .insertOne(offer)
       .then((data) => {
          resolve(data)
        })
        
    });
    },
  getOffers: () => {
    return new Promise(async(resolve, reject) => {
     let coupons= await db.get()
        .collection(collection.OFFERS_COLLECTION)
       .find().toArray().then((data) => {
           resolve(data)
         })
        
    });
    },
  
  applyCoupons: async (cId, userId) => {
    let used = await db.get().collection(collection.CART_COLLECTION).find({ user: objectId(userId) }).toArray()
   
    if (used[0].cDiscount) {
      return {applied:true}
    }

    let check = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find({
        _id: objectId(userId),
        usedCoupon: { $in: [cId] },
      }).toArray()
   
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
            { $set: { coupon: cId, couponDiscount: coupons[0].percentage, cDiscount:true } }, { upsert: true }).then((data) => {
              
            })
          resolve(coupons)
        }
       
      })
    } else {
      return {Already:true}
    }
  },
};
