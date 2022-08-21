var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
module.exports = {
  // addUser:(product,callback)=>{

  //     db.get().collection('user').insertOne(product).then((data)=>{

  //         callback(data)
  //     })
  // },
  getAllproducts: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getAllcategories: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let categories = await db
        .get()
        .collection(collection.PRODUCT_CATAGORY)
        .find()
        .toArray();
      resolve(categories);
    });
  },

  getCategories: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_CATAGORY)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getProductData: (editProduct) => {
    console.log(editProduct);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .findOne({ _id: objectId(editProduct) })
        .then((productData) => {
          resolve(productData);
        });
    });
  },

  getCategory: (editProduct) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATAGORY)
        .findOne({ _id: objectId(editProduct.toHexString()) })
        .then((productData) => {
          resolve(productData);
        });
    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .deleteOne({ _id: objectId(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteCategory: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATAGORY)
        .deleteOne({ _id: objectId(prodId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .findOne({ _id: objectId(prodId) })
        .then((user) => {
          resolve(user);
        });
    });
  },
  getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((user) => {
          resolve(user);
        });
    });
  },


  //ADD-PRODUCT
  addItem: (userData) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },
  

  //ADD-CATEGORY
  addCategory: (userData) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATAGORY)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
        });
    });
  },

  updateProduct: (proId, proDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              name: proDetails.name,
              category: proDetails.category,
              description: proDetails.description,
              price: proDetails.price,
              Image: proDetails.Image,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  updateCategory: (proId, proDetals) => {
    console.log(proId, proDetals);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_CATAGORY)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              category: proDetals.category,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  
  updateUser: (proId, proDetals) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTIONS)
        .updateOne(
          { _id: objectId(proId) },
          {
            $set: {
              Email: proDetals.Email,
              Password: proDetals.Password,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteCartItem: (cartId, proId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(cartId) },
          {
            $pull: { products: { item: objectId(proId) } },
          }
        )
        .then((response) => {
          response.removed = true;
          resolve(response);
        });
    });
  },

  getGraphDetails: () => {
    return new Promise(async (resolve, reject) => {
      let week = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          timeStamp: {
            $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        })
        .sort({ timeStamp: -1 })
        .toArray();

      resolve(week);
    });
  },

  getMonthDetails: () => {
    return new Promise(async (resolve, reject) => {
      let month = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          timeStamp: {
            $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        })
        .sort({ timeStamp: -1 })
        .toArray();

      resolve(month);
    });
  },

  getYearDetails: () => {
    return new Promise(async (resolve, reject) => {
      let month = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({
          timeStamp: {
            $gte: new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000),
          },
        })
        .sort({ timeStamp: -1 })
        .toArray();

      resolve(month);
    });
  },
};
