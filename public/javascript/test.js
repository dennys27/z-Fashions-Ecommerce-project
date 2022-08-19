categoryoffer: (body) => {
      
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(body.category) })
            let offer = await db.get().collection(collection.OFFER_COLLECTION).findOne({ _id: objectId(body.offer) })

            if (category) {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: objectId(body.category) }).toArray()

                products.map(async (products) => {
                    let cuttingprice = products.cuttingprice;
                    let price = products.price;

                    discount = (cuttingprice * offer.Percentage)/100

                    price = parseInt(cuttingprice - discount)

                    await db.get().collection(collection.PRODUCT_COLLECTION).updateMany({ _id: objectId(products._id) },
                        {
                            $set: {
                                cuttingprice: cuttingprice, price: price, offername: offer.name, discountprice: discount, categoryoffer: true
                            }
                        })
                   await db.get().collection(collection.CATEGORY_COLLECTION).updateMany({ _id: objectId(category._id) },
                        {
                            $set: {
                                offername: offer.name, offerpercentage: offer.Percentage, categoryoffer: true
                            }
                        })

                    resolve()

                })


            } else {
                console.log('invalid category');
            }
        })

    }