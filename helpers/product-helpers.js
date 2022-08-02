var db=require('../config/connection')
var collection=require('../config/collections')
const { ObjectId } = require('mongodb')
const bcrypt = require('bcrypt')
var objectId=require('mongodb').ObjectId
module.exports={

    // addUser:(product,callback)=>{
        
    //     db.get().collection('user').insertOne(product).then((data)=>{

    //         callback(data)
    //     })
    // },
    getAlluser:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(prodId)}).then((user)=>{
                resolve(user)
            })
        })
    }, 
    doAdd: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })

        })
    },
    updateUser:(proId,proDetals)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Email:proDetals.Email,
                    Password:proDetals.Password
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }
}