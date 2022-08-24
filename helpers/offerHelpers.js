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
        let exp = coupon.ending;
        let year = exp.slice(0, 4);
        let month = exp.slice(5, 7);
        let day = exp.slice(8, 10);
        console.log(exp);
        coupon.expireAt= new Date(`${year},${month},${day}`),
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
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPONS)
        .find()
        .toArray();
      resolve(coupons);
    });
  },
  checkCoupons: (cId) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPONS)
        .find({ code: cId })
        .toArray();
      resolve(coupons);
    });
  },

  deleteCoupon: (cId) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.COUPONS)
        .deleteOne({ _id: objectId(cId) });
      resolve(coupons);
    });
  },

  addOffer: (offer) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.OFFERS_COLLECTION)
        .insertOne(offer)
        .then((data) => {
          resolve(data);
        });
    });
  },

  addProductOffer: (data) => {
    return new Promise(async (resolve, reject) => {

      let product = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ _id: objectId(data.prodId) }).toArray()
      console.log(product[0].cuttPrice);
      let discount = (parseInt(product[0].cuttPrice) * parseInt(data.percentage)) / 100;
      console.log(discount);
      let price = parseInt(product[0].cuttPrice - discount);
      console.log(price);
     await db
       .get()
       .collection(collection.PRODUCT_COLLECTIONS)
       .updateMany(
         { _id: objectId(data.prodId) },
         {
           $set: {
             price: price,
             offername: data.offer,
             discountprice: discount,
             discountpercentage: data.percentage,
             cuttPrice: product[0].cuttPrice,
           },
         }
      );
       resolve({ status: true });
    });
   
  },

  categoryoffer: (req) => {
    return new Promise(async (resolve, reject) => {
      let offers = await db
        .get()
        .collection(collection.OFFERS_COLLECTION)
        .findOne({ _id: objectId(req.offerId) });
      
      console.log(offers.offer);
      
      let categories = await db
        .get()
        .collection(collection.PRODUCT_CATAGORY).findOne({ _id: objectId(req.categoryId) })
      console.log(categories);
      
      if (categories) {
          let products = await db
            .get()
            .collection(collection.PRODUCT_COLLECTIONS)
            .find({ category: categories.category })
            .toArray();
        
        
        //changing the prices

         products.map(async (prod) => {
           
           let price = parseInt(prod.price);
           let cutt = price;
          
           discount = (prod.cuttPrice * offers.percentage) / 100;
           console.log(discount);

           price = parseInt(prod.cuttPrice - parseInt(discount));
           await db
             .get()
             .collection(collection.PRODUCT_COLLECTIONS)
             .updateMany(
               { _id: objectId(prod._id) },
               {
                 $set: {
                   price: price,
                   offername: offers.offer,
                   discountprice: discount,
                   discountpercentage: offers.percentage,
                   categoryoffer: true,
                   cuttPrice: prod.cuttPrice,
                 },
               }
             );
           await db
             .get()
             .collection(collection.PRODUCT_CATAGORY)
             .updateMany(
               { _id: objectId(categories._id) },
               {
                 $set: {
                   offername: offers.offer,
                   offerpercentage: offers.percentage,
                   categoryoffer: true,
                 },
               }
             );

           resolve();
         });
        //ending......

        
      } else {
        resolve({err:"invalid operation"})
      }
        
    });
  },

  getOffers: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.OFFERS_COLLECTION)
        .find()
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },

  resetCoupon: (userId) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { user: objectId(userId) },
          { $unset: { coupon: "", couponDiscount: "", cDiscount: "" } })
       resolve();
    }).then((data) => {
      console.log(data);
     
    })
  },

  applyCoupons: async (cId, userId) => {
    let used = await db
      .get()
      .collection(collection.CART_COLLECTION)
      .find({ user: objectId(userId) })
      .toArray();

    if (used[0].cDiscount) {
      return { applied: true };
    }

    let check = await db
      .get()
      .collection(collection.USER_COLLECTION)
      .find({
        _id: objectId(userId),
        usedCoupon: { $in: [cId] },
      })
      .toArray();

    if (check.length === 0) {
      let response = {};
      return new Promise(async (resolve, reject) => {
        let coupons = await db
          .get()
          .collection(collection.COUPONS)
          .find({ code: cId })
          .toArray();
        let date = new Date();
        let starting = new Date(coupons[0].starting);
        let ending = new Date(coupons[0].ending);
        if (date <= ending || date >= starting) {
          coupons[0].cExist = true;
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $set: {
                  coupon: cId,
                  couponDiscount: coupons[0].percentage,
                  cDiscount: true,
                },
              },
              { upsert: true }
            )
            .then((data) => {});
          resolve(coupons);
        }
      });
    } else {
      return { Already: true };
    }
  },
};
