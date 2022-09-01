var db = require("../config/connection");
var collection = require("../config/collections");
const { ObjectId } = require("mongodb");
// const { response } = require("express");
const bcrypt = require("bcrypt");
const collections = require("../config/collections");
var objectId = require("mongodb").ObjectId;

 let reportData =[];
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

  // getSalesReport: () => {
  //   return new Promise(async (resolve, reject) => {
  //  let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
  //     { $group: { _id: "$userId", count: { $sum: 1 } } },
  //     { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
  //     { $project: { name: "$_id", _id: 0 } },
  //  ]).toArray()
  //     console.log(data);
  //     resolve()
  //   });
  // },

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

  //sales data testing


  fetchTopUsers: async () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $group: {
              _id: "$userId",
              title: {
                $first: "$userId",
              },
              topuser: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              topuser: -1,
            },
          },
          {
            $limit: 5,
          },
          {
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "_id",
              foreignField: "_id",
              as: "users",
            },
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data.sort());
        });
    });
  },

  fetchTopSold: async () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $unwind: {
              path: "$products",
            },
          },
          {
            $group: {
              _id: "$products.item",
              title: {
                $first: "$products.item",
              },
              totalSold: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              totalSold: -1,
            },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTIONS,
              localField: "_id",
              foreignField: "_id",
              as: "product",
            },
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },

  // fetchTopTestSold: async () => {
   
  //   return new Promise(async (resolve, reject) => {
  //      const d = new Date();
  //     let thismonth = d.getMonth();
  //     console.log(thismonth);
  //     await db
  //       .get()
  //       .collection(collections.ORDER_COLLECTION)
  //       .aggregate([
  //         {
  //           $unwind: {
  //             path: "$products",
  //           },
  //         },
  //         {
  //           $group: {
  //             _id: "$products.item",
  //             title: {
  //               $first: "$products.item",
  //             },
  //             totalSold: {
  //               $sum: 1,
  //             },
  //           },
  //         },
  //         {
  //           $sort: {
  //             totalSold: -1,
  //           },
  //         },
  //         {
  //           $limit: 10,
  //         },
  //         {
  //           $lookup: {
  //             from: collection.PRODUCT_COLLECTIONS,
  //             localField: "_id",
  //             foreignField: "_id",
  //             as: "product",
  //           },
  //         },
  //         // { $project: { month: { $month: "$timeStamp" } } },
  //         // { $match: { month: thismonth } },
  //       ])
  //       .toArray()
  //       .then((data) => {
  //         console.log(data);
  //         resolve(data);
  //       });
  //   });
  // },

  fetchMonthlyData: async () => {
    reportData = [];

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CATAGORY_COLLECTION)
        .aggregate([
          {
            $project: {
              category: 1,
              _id: 0,
            },
          },
        ])
        .toArray()
        .then((catagory) => {
          resolve(catagory);
        });
    });
  },

  fetchData: async (selectedYR) => {
    let selectedYear = parseInt(selectedYR);

    let category = await db
      .get()
      .collection(collections.PRODUCT_CATAGORY)
      .find()
      .toArray();
    //console.log(category);
    return new Promise(async (resolve, reject) => {
      await category.map(async (element) => {
        return new Promise(async (resolve, reject) => {
          await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $project: {
                  status: 1,
                  totalAmount: 1,
                  products: 1,
                  year: {
                    $year: "$timeStamp",
                  },
                  timeStamp: 1,
                },
              },
              {
                $match: {
                  status: "placed",
                  year: selectedYear,
                },
              },
              {
                $unwind: "$products",
              },
              {
                $project: {
                  productId: "$products.item",
                  productQuantity: "$products.quantity",
                  totalAmount: 1,
                  timeStamp: 1,
                  year: 1,
                  _id: 1,
                },
              },
              {
                $lookup: {
                  from: collections.PRODUCT_COLLECTIONS,
                  localField: "productId",
                  foreignField: "_id",
                  as: "product",
                },
              },
              {
                $project: {
                  category: "$product.category",

                  month: {
                    $month: "$timeStamp",
                  },
                  productQuantity: 1,
                  totalAmount: 1,
                  timeStamp: 1,
                  year: 1,
                },
              },
              {
                $match: {
                  category: element.category,
                },
              },
              {
                $group: {
                  _id: {
                    month: {
                      $month: "$timeStamp",
                    },
                  },
                  totalAmount: {
                    $sum: "$totalAmount",
                  },
                  productQuantity: {
                    $sum: "$productQuantity",
                  },
                },
              },
              {
                $sort: {
                  _id: 1,
                },
              },
              {
                $project: {
                  month: "$_id.month",
                  totalAmount: 1,
                  productQuantity: 1,
                  _id: 0,
                },
              },
            ])
            .toArray()

            .then((data) => {
              if (data.length < 12) {
                for (let i = 1; i <= 12; i++) {
                  let datain = true;
                  for (let j = 0; j < data.length; j++) {
                    if (data[j].month === i) {
                      datain = null;
                    }
                  }

                  if (datain) {
                    data.push({
                      totalAmount: 0,
                      productQuantity: 0,
                      month: i,
                    });
                  }
                }
              }
              return data;
            })
            .then(async (data) => {
              await data.sort(function (a, b) {
                return a.month - b.month;
              });
              return data;
            })
            .then(async (data) => {
              reportData.push({
                category: element.category,
                data: data,
              });

              return reportData;
            });
        });
      });
      setTimeout(() => {
        resolve(reportData);
      }, 1000);
      reportData = [];
    });
  },

  //sales test ends here

  // getSales: () => {
  //   return new Promise(async (resolve, reject) => {
  //     await db
  //       .get()
  //       .collection(collections.ORDER_COLLECTION)
  //       .aggregate([
  //         {
  //           $group: {
  //             _id: {
  //               $week: "$timeStamp",
  //             },
  //             total: {
  //               $sum: {
  //                 $sum: "$products.quantity",
  //               },
  //             },
  //           },
  //         },
  //       ]).toArray().then((data) => {
  //         console.log(data);
  //       })
  //   });
  // },

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

  // test: async () => {
  //   let data = await db
  //     .get()
  //     .collection(collections.ORDER_COLLECTION)
  //     .aggregate([
  //       { $match: { status: "delivered" } },
  //       {
  //         $group: {
  //           _id: {
  //             truncatedOrderDate: {
  //               $dateTrunc: {
  //                 date: "$timeStamp",
  //                 unit: "year",
  //                 binSize: 1,
  //               },
  //             },
  //           },
  //           sumQuantity: { $sum: "$totalAmount" },
  //         },
  //       },
  //       {
  //         $project: {
  //           year: { $year: "$_id.truncatedOrderDate" },
  //           sumQuantity: 1,
  //         },
  //       },
  //       { $sort: { year: 1 } },
  //     ])
  //     .toArray();

  //   let len = data.length;
  //   if (data[0]) {
  //     baseyear = data[0].year;
  //   }

  //   let linechartData = {};
  //   for (let i = 0; i < data.length; i++) {
  //     if (baseyear == data[len - 1].year) break;
  //     console.log(i);
  //     if (baseyear == data[i].year) {
  //       baseyear++;
  //     } else {
  //       let a = { sumQuantity: 0, year: baseyear };
  //       data.push(a);
  //       baseyear++;
  //       i--;
  //       if (i == len - 1) break;

  //       console.log(i);
  //     }
  //   }
  //   data.sort(function (a, b) {
  //     return a.year - b.year;
  //   });

  //   let linechartYear = [];
  //   let linechartSum = [];
  //   data.forEach((element) => {
  //     let a = element.year;
  //     linechartYear.push(a);
  //   });
  //   data.forEach((element) => {
  //     let a = element.sumQuantity;
  //     linechartSum.push(a);
  //   });

  //   linechartData.year = linechartYear;
  //   linechartData.sum = linechartSum;

  //   return linechartData;
  // },
};

