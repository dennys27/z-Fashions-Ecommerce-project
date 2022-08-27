





fetchMonthlyData: async () => {
    reportData = [];
     
    return new Promise(async (resolve, reject) => {
        await db.get().collection(collection.CATAGORY_COLLECTION).aggregate([{
            $project: {
                catagory: 1,
                _id: 0
            }
        }]).toArray().then((catagory) => {
            resolve(catagory)
        })

    })
};
   
 fetchData : async (catagory, selectedYear) => {
        selectedYear = parseInt(selectedYear)
        console.log(selectedYear)

        return new Promise(async (resolve, reject) => {


            await catagory.map(async (element) => {
      
                return new Promise(async (resolve, reject) => {
                    await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                        {
                            $project: {
                                cancellation: 1,
                                totalAmount: 1,
                                products: 1,
                                year: {
                                    $year: "$timeStamp"
                                },
                                timeStamp: 1


                            }
                        },
                        {
                            $match: {
                                cancellation: false,
                                year: selectedYear
                            }
                        },
                        {
                            $unwind: "$products"
                        },
                        {
                            $project: {
                                productId: "$products.item",
                                productQuantity: "$products.quantity",
                                totalAmount: 1,
                                timeStamp: 1,
                                year: 1,
                                _id: 1

                            }
                        }, {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: 'productId',
                                foreignField: '_id',
                                as: 'product'
                            }
                        }, {
                            $project: {
                                catagory: "$product.catagory",
                                subCatagory: "$product.subCatagory",
                                month: {
                                    $month: "$timeStamp"
                                },
                                productQuantity: 1,
                                totalAmount: 1,
                                timeStamp: 1,
                                year: 1
                            }
                        }, {
                            $match: {
                                catagory: element.catagory
                            }
                        }, {
                            $group: {
                                _id: {
                                    month: {
                                        $month: "$timeStamp"
                                    }
                                },
                                totalAmount: {
                                    $sum: "$totalAmount"
                                },
                                productQuantity: {
                                    $sum: "$productQuantity"
                                }
                            }

                        }, {
                            $sort: {
                                _id: 1
                            }
                        }, {
                            $project: {
                                month: "$_id.month",
                                totalAmount: 1,
                                productQuantity: 1,
                                _id: 0
                            }
                        }
                    ]).toArray()
        
       

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
                                        data.push({ totalAmount: 0, productQuantity: 0, month: i })
                                    }

                                }
                            }
                            return data
                        }).then(async (data) => {
   
                            await data.sort(function (a, b) {
                                return a.month - b.month
                            });
                            return data
                        }).then(async (data) => {
                            console.log(data)
                            reportData.push({ catagory: element.catagory, data: data })
             
                            return (reportData)

                        })

                })

            })
            setTimeout(() => {
                resolve(reportData)
                console.log(reportData, ".........tes")
            }, 500); 
        }
        )
    };