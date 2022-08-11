var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
const { response } = require("express");
const bcrypt = require("bcrypt");
const collections = require("../config/collections");
var objectId = require("mongodb").ObjectId;


module.exports = {
  getOrders: () => {
    return new Promise(async (resolve, reject) => {
      let Items = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find()
        .toArray();
      resolve(Items);
    });
  },

  changeOrderStatus: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      let Order = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: status,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },

  getLastweekOrders: (orderId, status) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .find({
          timeStamp: {
            $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
          },
        })
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },

  codTotal: () => {
    return new Promise(async (resolve, reject) => {
      var codTotal = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "COD" },
          },
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $toInt: "$totalAmount" },
              },
            },
          },
        ])
        .toArray();
      resolve(codTotal[0]);
    });
  },

  razorTotal: () => {
    return new Promise(async (resolve, reject) => {
      var codTotal = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "RazorPay" },
          },
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $toInt: "$totalAmount" },
              },
            },
          },
        ])
        .toArray();
      resolve(codTotal[0]);
    });
  },

  paypalTotal: () => {
    return new Promise(async (resolve, reject) => {
      var codTotal = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { paymentMethod: "PayPal"},
          },
          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $toInt: "$totalAmount" },
              },
            },
          },
        ])
        .toArray();
      resolve(codTotal[0]);
    });
  },
};

