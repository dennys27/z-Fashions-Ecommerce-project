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
            
            let Items = await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            resolve(Items)
           
            
        })
    },

    changeOrderStatus: (orderId,status) => {
        return new Promise(async (resolve, reject) => {
            
            let Order = await db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                
                    $set:{
                       status:status
                    }
                
            })
            console.log(Order);
            resolve()
           
            
        })
    },


}