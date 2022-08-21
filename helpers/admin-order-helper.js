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

  getSalesReport: () => {
    return new Promise(async (resolve, reject) => {
   let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
      { $project: { name: "$_id", _id: 0 } },
   ]).toArray()
      console.log(data);
      resolve()
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
            $match: { paymentMethod: "PayPal" },
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

  test: async () => {
    let data = await db
      .get()
      .collection(collections.ORDER_COLLECTION)
      .aggregate([
        { $match: { status: "delivered" } },
        {
          $group: {
            _id: { 
              truncatedOrderDate: {
                $dateTrunc: { 
                  date: "$timeStamp",
                  unit: "year",
                  binSize: 1,
                },
              },
            },
            sumQuantity: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            year: { $year: "$_id.truncatedOrderDate" },
            sumQuantity: 1,
          },
        },
        { $sort: { year: 1 } },
      ])
      .toArray();

    
    let len = data.length;
    baseyear = data[0].year;
    let linechartData = {};
    for (let i = 0; i < data.length; i++) {
      if (baseyear == data[len - 1].year) break;
      console.log(i);
      if (baseyear == data[i].year) {
        baseyear++;
      } else {
        let a = { sumQuantity: 0, year: baseyear };
        data.push(a);
        baseyear++;
        i--;
        if (i == len - 1) break;

        console.log(i);
      }
    }
    data.sort(function (a, b) {
      return a.year - b.year;
    });
   
    let linechartYear = [];
    let linechartSum = [];
    data.forEach((element) => {
      let a = element.year;
      linechartYear.push(a);
    });
    data.forEach((element) => {
      let a = element.sumQuantity;
      linechartSum.push(a);
    });

    linechartData.year = linechartYear;
    linechartData.sum = linechartSum;
  
    return linechartData;
  },
};

