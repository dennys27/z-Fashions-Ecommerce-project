var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const CC = require("currency-converter-lt");

module.exports = {
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });

      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve({ added: true });
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve({ added: true });
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve({ added: true });
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();

      resolve(cartItems);
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            {
              _id: objectId(details.cart),
              "products.item": objectId(details.product),
            },
            {
              $inc: {
                "products.$.quantity": details.count,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      }
    });
  },

  getCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  getDiscount: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) })
        .then(async (data) => {
          if (data) {
            if (data.coupon) {
              await db
                .get()
                .collection(collection.USER_COLLECTION)
                .updateOne(
                  { _id: objectId(userId) },
                  { $push: { usedCoupon: data.coupon } }
                );
            }
          }
          
           
          resolve({
            code: data.coupon,
            couponDiscount: data.couponDiscount,
          });
        });
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: ["$quantity", { $toInt: "$product.price" }],
                },
              },
            },
          },
        ])
        .toArray();
      if (total.length != 0) {
        resolve(total[0].total);
      } else {
        resolve(0);
      }
    });
  },

  placeOrder: (order, products, total, coupon, discounted, secondTotal) => {
    return new Promise(async (resolve, reject) => {
      let status = order.PaymentMethod === "COD" ? "placed" : "pending";
      if (order.PaymentMethod === "wallet") {
        status = order.PaymentMethod === "wallet" ? "placed" : "pending";
      }
       
      let orderObj = {
        deliveryDetails: {
          firstName: order.FirstName,
          lastName: order.LastName,
          mobile: order.PhoneNumber,
          address: order.Address,
          pincode: order.Zipcode,
          appartment: order.Apartment,
          city: order.City,
          state: order.State,
          country: order.Country,
          totalAmount: total,
        },
        walletDeducted:order.walletMinus,
        coupon: coupon.code,
        couponDiscount: coupon.couponDiscount,
        couponDiscounted: discounted,
        totalAmount: total,
        secondTotalAmount: secondTotal,
        userId: objectId(order.userId),
        paymentMethod: order.PaymentMethod,
        products: products,
        date: new Date().toDateString(),
        status: status,
        timeStamp: new Date(),
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          // db.get()
          //   .collection(collection.CART_COLLECTION)
          //   .deleteOne({ user: objectId(order.userId) });
          resolve(response);
        });
    });
  },

  //delete cart
  deleteCart: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .deleteOne({ user: objectId(orderId) });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        resolve(cart.products);
      } else {
        resolve();
      }
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray();

      resolve(products);
    });
  },

  getOrderId: (user) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ userId: ObjectId(user) })
        .then((orderDetails) => {
          resolve(orderDetails);
        });
    });
  },

  getInvoice: (order) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: ObjectId(order) })
        .then((orderDetails) => {
          resolve(orderDetails);
        });
    });
  },

  getAppliedCoupn: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .find({ user: objectId(userId) })
        .toArray()
        .then((data) => {
          if (data[0]) {
            if (data[0].couponDiscount) {
              data[0].cpn = true;
              resolve(data);
            } else {
              resolve({ ncpn: true });
            }
          } else {
            resolve();
          }
        });
    });
  },
};
