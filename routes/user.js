var express = require("express");
require("dotenv").config();
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-management");
const cartHelpers = require("../helpers/cart-helpers");
const paypal = require("paypal-rest-sdk");
const offerHelpers = require("../helpers/offerHelpers");
// const { Db } = require("mongodb");
const referralCodeGenerator = require("referral-code-generator");

let walletStatus;
let walletAmount;
const varifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.render("user/login");
    req.session.err = false;
  }
};

const client = require("twilio")(
  process.env.ACCOUNT_SID,
  process.env.AUTH_TOKEN,
  {
    lazyLoading: true,
  }
);

let User_number = "";
let guestuser = true;

/* GET home page. */
router.get("/", async function (req, res, next) {
  try {
     let cartCount = 0;
  let user = req.session.user;
  let U_session = req.session;
  userHelpers.isExist(U_session);
  if (req.session.user) {
    cartCount = await cartHelpers.getCount(req.session.user._id);
  }

  productHelpers.getAllproducts().then((products) => {
    let men = [];
    let women = [];

    products.map((data) => {
      if (data.category == "men") {
        men.push(data);
      } else if (data.category == "women") {
        women.push(data); 
      }
    });

    res.render("index", { guestuser, women, men, user, cartCount });
  });
  } catch {
    res.render("error")
  }
 
});

router.get("/login", function (req, res) {
  let blocked = req.session.blockedUser;

  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginerr: req.session.loginErr, blocked });
    req.session.loginErr = false;
    blocked = false;
  }
});

//otp section

router.get("/otp-login", function (req, res) {
  try {
      if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/otp");
    req.session.loginErr = false;
  }
  } catch {
    res.render("error")
  }
 
});

router.post("/otp-verification", function (req, res) {
  userHelpers.NumberExist(req.body.number).then((resp) => {
    if (resp.userExist == false) {
      res.render("user/otp", { UserNotExist: true });
    } else {
      if (resp.userBlock !== true) {
        console.log("it should be working");
        // req.session.user = resp.Email;
        req.session.user = resp;

        // req.session = resp
        const { number } = req.body;

        User_number = number;
        client.verify.services(process.env.SERVICE_SID).verifications.create({
          to: `+91${number}`,
          channel: "sms",
        });
      }
      res.render("user/otp-veri", { user: resp.user });
    }
  });
});

router.post("/otp-matching", function (req, res) {
  const { otp } = req.body;

  client.verify
    .services(process.env.SERVICE_SID)
    .verificationChecks.create({
      to: `+91${User_number}`,
      channel: "sms",
      code: otp,
    })
    .then((resp) => {

      if (resp.valid == false) {
        req.session.otp = true;
        let otpvalidation = req.session.otp;
        res.render("user/otp-veri", { otpvalidation });
      } else if (resp.valid == true) {
        console.log(resp.valid);
        res.redirect("/");

      }
    });
});

//signup process

router.get("/signup", function (req, res) {
  try {
      if (req.session.loggedIn) {
        res.redirect("/");
      } else {
        res.render("user/signup", {
          guestuser,
          signerr: req.session.signErr,
          phoneerr: req.session.phnExists,
        });
        req.session.signErr = false;
        req.session.phnExists = false;
      }
  } catch {
    res.render("error")
  }
  
});

router.post("/signup", (req, res) => {
  let rCode = referralCodeGenerator.alphaNumeric("uppercase", 2, 2);
  req.body.refferalCode = rCode;

  let reqBody = req.body;
  reqBody.block = false;
  userHelpers.doSignup(reqBody).then((response) => {
    if (response.status) {
      req.session.signErr = true; 
      res.redirect("/signup");
    } else if (response.phone) {
      req.session.phnExists = true;
      res.redirect("/signup");
    } else {
      res.redirect("/login");
    }
  });
});

//view-product

router.get("/view-product/:id", function (req, res) {
  try {
     productHelpers.getProductData(req.params.id).then((Product) => {
   
    res.render("user/product-view", { guestuser, Product, userHead: true });
  });
  } catch {
    res.render("error")
  }
 
});

//user address

router.get("/my-addresses/:id", varifyLogin, function (req, res) {
  let user = req.session.user
  userHelpers.getUserDetails(req.params.id).then((userData) => {
     req.session.fordel=userData._id
     res.render("user/user-addresses", {user, userData, userHead: true });
  })
   
}); 
 

router.post("/make-default", varifyLogin, async(req, res)=> {
  await userHelpers.addressDefault(req.body.uId, req.session.fordel).then((data) => {
   
    data.default = true;
    res.json(data)
  })
});




router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.userBlock) {
      req.session.blockedUser = true;   
      res.redirect("/login");
    } else if (response.status) {
      req.session.user = response.user;
      req.session.user = response.user;

      req.session.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.loggedIn = null;
  req.session.user = null; 
  res.redirect("/");
});


// cart section
router.get("/cart", varifyLogin, async function (req, res) {

  //await offerHelpers.resetCoupon(req.session.user._id);
  let coupDetails = await cartHelpers.getAppliedCoupn(req.session.user._id);
  console.log(coupDetails);
  await cartHelpers.getCount(req.session.user._id).then((cartCount) => {
     let user = req.session.user;
    cartHelpers.getCartProducts(req.session.user._id).then(async (data) => {
      for (i = 0; i < data.length; i++){
        data[i].subtotal = data[i].quantity * data[i].product.price;
      }
      
      let total = await cartHelpers.getTotalAmount(req.session.user._id);
      let beforDisc = total;

      let actual;
      if (coupDetails) {
         
       
         if (coupDetails[0]) {
           if (coupDetails[0].cpn) {
             //console.log(coupDetails[0].couponDiscount);
             let discount =
               (parseInt(total) * parseInt(coupDetails[0].couponDiscount)) /
               100;
             actual = discount;
             total = parseInt(total - discount);
           } else if (coupDetails.ncpn) {
           }
         }
         }
        
        
       res.render("user/Cart", { user, data, cartCount,actual,beforDisc,total,coupDetails });
     });
  })
 
});

router.post("/add-to-cart/:id", varifyLogin, (req, res) => {
  cartHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    res.json(data); 
  });
});

//product quantity and subtotal
router.post("/change-product-quantity", varifyLogin, (req, res) => {
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    let total = await cartHelpers.getTotalAmount(req.session.user._id);
    if (total < 1000) {
      console.log(req.session.user._id,"fshgsfkgggggggggggggfgggggg");
      await offerHelpers.resetCoupon(req.session.user._id);
      response.hitmin = true
    }
 
    if (total > 0) {
      response.total = total;
     
    } 

    let details = await cartHelpers.getCartProducts(req.session.user._id)
    let coupon = await cartHelpers.getAppliedCoupn(req.session.user._id);
    let cartAmount = await cartHelpers.getTotalAmount(req.session.user._id);
    
    let discountPrice;
    if (coupon[0]) {
      discountPrice =  (parseInt(coupon[0].couponDiscount) * cartAmount) / 100;
      console.log(discountPrice);
      response.discounted = discountPrice;
      response.firstTotal = response.total;
      response.total = response.total - discountPrice;
    }
    
    for (i = 0; i < details.length; i++) {
      if (details[i].product._id == req.body.product) {
        response.productId = req.body.product;
        response.quantity = details[i].quantity;
        response.subtotal = details[i].product.price * details[i].quantity;
      }
    }
    res.json(response);
  });
}); 


router.get("/checkout", varifyLogin, async (req, res) => {
  
  let discounted;
  ///testing
  let user = req.session.user;
  let defaultAddress;
  let total = await cartHelpers.getTotalAmount(req.session.user._id);
  let totalPrice = await cartHelpers.getTotalAmount(req.session.user._id);
  if (totalPrice > 0) {
    let userAd = await userHelpers.getUserDetails(req.session.user._id);
  
    if (userAd.deliveryAddress) {
      userAd.deliveryAddress.map((data) => {
        if (data.default == true) {
          defaultAddress = data
        }
      })
    }

     await cartHelpers
       .getDiscount(req.session.user._id)
       .then((discountedPrice) => {
         coupon = discountedPrice;

         if (discountedPrice.code) {
           discounted = (discountedPrice.couponDiscount * total) / 100;
           total =
             total - (discountedPrice.couponDiscount * total) / 100;
         }
       });
    req.session.walletCompare = total;

    res.render("user/checkout", { user,userAd, defaultAddress,discounted,totalPrice, total, Empty: false });
  } else {
    res.render("user/Cart", { user, emptyCart: true });
  }
});

router.post("/wallet", varifyLogin, async (req, res) => {
  try {

    console.log(req.body);
    let amount = req.session.walletCompare;
    console.log(amount);
    let wallet = await userHelpers.getUserDetails(req.session.user._id);
    if (wallet.wallet >= amount) {
      res.json({
        walletPayment: true,
        fullWallet: true,
        amount: wallet.wallet,
      });
      walletStatus = true;
    } else {
      res.json({
        walletPayment: false,
        partialPayment: true,
        amount: wallet.wallet,
      });
      console.log("what are you doing.....");
      walletStatus = false;
    }
    
  } catch {
    res.send("something went wromg..")
  }
 
  
  
});



//payment gateway

router.post("/checkout-form", varifyLogin, async (req, res) => {
 // console.log(req.body,"tocheck............");
  let user = req.session.user._id;
  let wallet = await userHelpers.getUserDetails(user)
  let products = await cartHelpers.getCartProductList(req.body.userId);
  let totalPrice = await cartHelpers.getTotalAmount(req.body.userId);
  let coupon; 
  let discounted;
  let secondTotal = totalPrice;

  await cartHelpers.getDiscount(user).then((discountedPrice) => {
    coupon = discountedPrice;
    if (discountedPrice.code) {
     discounted = (discountedPrice.couponDiscount * totalPrice) / 100;
     totalPrice = totalPrice - (discountedPrice.couponDiscount * totalPrice) / 100
   }
  });

  
  //req.body.wallet === undefined ? req.body.wallet = false : req.body.wallet;
  if (req.body.wallet === undefined) {
     req.body.wallet = false;
  }
  var greater = false;
      //  console.log(req.body.wallet);
      //  console.log(req.body.walletStatus);
    if (req.body.wallet === true || req.body.walletStatus==="true") {
      

      req.session.walletStatus = true;
      req.session.walletAmount = wallet.wallet;

      if (wallet.wallet > totalPrice) {
     
        greater = true;
        let amount = wallet.wallet - totalPrice;
        userHelpers.useWallet(req.session.user._id, amount);
        walletAmount=totalPrice
         req.body.PaymentMethod = "wallet";
        
      } else {
        let amount = wallet.wallet - totalPrice;
        totalPrice = totalPrice - wallet.wallet;
        
        walletAmount = wallet.wallet;
       console.log(amount,"testing.......................");
        
        if (amount < 0) {
          amount = 0;
        }
        req.body.walletMinus = (amount + totalPrice )- (amount + totalPrice-wallet.wallet);
       
        userHelpers.useWallet(req.session.user._id, amount);
      }
    }



  if (greater == true) {
     
    cartHelpers.placeOrder(
      req.body,
      products,
      totalPrice,
      coupon,
      discounted,
      secondTotal
    ).then((data) => {
     
      
       userHelpers.setWalletHistory(
         req.session.user._id,
         data.insertedId.toString(),
         walletAmount
       ).then((data) => {
         //console.log(data);
       })
      cartHelpers.deleteCart(req.session.user._id);
      res.json({ walletPayment: true })
    })
  } else {
    
  
    req.session.total = totalPrice
    if (totalPrice > 0) {
       console.log("oiiiiiiiiiiii");
      cartHelpers
        .placeOrder(
          req.body,
          products,
          totalPrice,
          coupon,
          discounted,
          secondTotal
        )
        .then((response) => {
          req.session.orderId = response.insertedId.toString();
          if (walletAmount != null) {
             userHelpers.setWalletHistory(
               req.session.user._id,
               response.insertedId.toString(),
               walletAmount
             );
          }
          
         
          //console.log(req.body["PaymentMethod"],"PAYMENT METHOD........");
        
           if (req.body["PaymentMethod"] == "COD") {
            cartHelpers.deleteCart(req.session.user._id);
            res.json({ codSuccess: true });
          } else if (req.body["PaymentMethod"] == "RazorPay") {
             console.log("random runner.........");
            cartHelpers.getOrderId(user).then((orderDetails) => {
              req.session.uniqueOrder = orderDetails._id;
              userHelpers
                .generateRazorPay(response.insertedId.toString(), totalPrice)
                .then((data) => {
                  data.razorpay = true;
                  res.json(data);
                }); 
            });
          } else if (req.body["PaymentMethod"] == "PayPal") {
            console.log("why am i being hitttttttt.....");
            userHelpers.converter(totalPrice).then((price) => {
              let converted = parseInt(price);
              cartHelpers.getOrderId(user).then((orderDetails) => {
                userHelpers
                  .generatePayPal(orderDetails._id.toString(), converted)
                  .then((data) => {
                    res.json(data);
                  });
              });
            });
          } else if (req.body["PaymentMethod"] == "Wallet") {
            // userHelpers.getUserDetails(req.session.user._id).then((data) => {
            //   if (data.wallet >= totalPrice) {
            //     let amount = data.wallet - totalPrice;
            //     userHelpers.useWallet(req.session.user._id, amount);
            //     cartHelpers.deleteCart(req.session.user._id);
            //     userHelpers
            //       .changePaymentStatus(req.session.orderId)
            //       .then((data) => {
            //         res.json({ wallet: true });
            //       });
            //   } else if (data.wallet <= totalPrice || data.wallet > 0) {
            //     res.json({ wallet: false });
            //   } else {
            //     res.json({ wallet: false });
            //   }
            // });
          }
        });

    } else {
      res.json({ cempty: true });
    }
  }
 

});


 // verify payment...............

router.post("/verify-payment", varifyLogin, (req, res) => {
    userHelpers
      .verifyPayment(req.body)
      .then((data) => {
        cartHelpers.deleteCart(req.session.user._id);
        userHelpers.changePaymentStatus(req.body["order[receipt]"])
          .then(() => {
           
           res.json({ status: true });
        })
          
        
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "" });
      });
  }
 
);



router.get("/wallet-history", varifyLogin, async (req, res) => {
  let user = req.session.user;
  let wallet = await userHelpers.getUserDetails(user._id)
  userHelpers.getWalletHistory(user._id).then((data) => {
    //console.log(data[0].transactions,"data is  here............");
      res.render("user/wallet-history", { user ,wallet,data});
   })
   
});


//orders list

router.get("/orders-list", varifyLogin, async (req, res) => {
 await userHelpers.deletePending();
  let user = req.session.user;
  let orders = await cartHelpers.getUserOrders(user._id);
  const reversed = orders.reverse()
  orders = reversed

  res.render("user/orderslist", { user, orders });
});

router.get("/view-order-details/:id", varifyLogin, async (req, res) => {
  let user = req.session.user;
  let products = await cartHelpers.getOrderProducts(req.params.id);
  console.log(products);
  let orderDetails = await cartHelpers.getInvoice(req.params.id);
   for (i = 0; i < products.length; i++) {
     products[i].product.subtotal =
       products[i].quantity * products[i].product.price;
   }
  res.render("user/invoice", { user, products,orderDetails });
});

//user profile
router.get("/my-account/:id", varifyLogin, async (req, res) => { 
  let user = req.session.user;
  let wallet = await userHelpers.getUserDetails(user._id)
  let userId = req.params.id;
  res.render("user/youraccount",{user,userId,wallet})
});

router.get("/user-profile-update", varifyLogin, (req, res) => {
  let user = req.session.user;
  res.render("user/addressupdate",{user});
});

router.post("/user-address-update", varifyLogin, (req, res) => {
  let user = req.session.user;
  let uniqueId = Math.random();
  req.body.uId = uniqueId;
  req.body.default = false;
  userHelpers.updateAddressDetails(user._id, req.body).then((response) => {
    res.json(response);
  });
});

//paypal
router.get("/success", varifyLogin, (req, res) => {
   cartHelpers.deleteCart(req.session.user._id);
  let amount = req.session.total;
  let orderIdPaypal = req.session.orderId;
  userHelpers.changePaymentStatus(orderIdPaypal).then(() => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: amount,
          },
        },
      ],
    };
    
    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      function (error, payment) {
        if (error) {
          console.log(error.response);
          throw error;
        } else {
          console.log(JSON.stringify(payment));
          res.redirect("/orders-list");
        }
      } 
    );
  });
});

router.get("/cancel", varifyLogin, (req, res) => {
  userHelpers.deleteOrder(req.session.orderId).then((data) => {
    res.redirect("/cart")
  })
});

//full products view

router.get("/view-all-products/:category", varifyLogin, (req, res) => {
  let user = req.session.user;
  let query = req.params.category
  console.log(query);
  productHelpers.getAllproducts().then((products) => {
    let men = [];
    let women = [];

    products.map((data) => {
      if (data.category == "men") {
        men.push(data);
      } else if (data.category == "women") {
        women.push(data);
      }
    });
    if (query == "men") {
       res.render("user/view-all-products", { user, men });
    } else {
       res.render("user/view-all-products", { user, women });
    }
   
   
  });


  
});

//profile edit

router.get("/profile-edit/:id", varifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.getUserDetails(user._id).then((data) => {
    res.render("user/profile-edit", { user, data });
  });
});

router.post("/profile-edit", varifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updatePersonalDetails(user._id, req.body).then((response) => {
    res.json(response);
  });
});

//change-password

router.get("/change-password/:id", varifyLogin, (req, res) => {
  let user = req.session.user;
  res.render("user/changePassword", { user });
});

router.post("/change-password/", varifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.updateUser(user._id, req.body).then((response) => {
    res.json(response);
  });
});

router.post("/delete-cart-product", varifyLogin, (req, res) => {
  let user = req.session.user;
  productHelpers
    .deleteCartItem(req.body.cart, req.body.product)
    .then((response) => {
      res.json(response);
    });
});

router.post("/user-cancel-order", varifyLogin, (req, res) => {
  let user = req.session.user;
  userHelpers.changeOrderStatus(req.body.order).then((response) => {
    res.json(response);
  });
});




//address-delete
router.post("/delete-address", varifyLogin, (req, res) => {
  userHelpers.deleteAddress(req.body.uId).then((data) => {
  res.json(data)
})
  
});

router.get("/test", varifyLogin, (req, res) => {
  userHelpers.getUserDetails(req.session.user._id).then((user) => {
    res.render("user/test", { user });
  });
});
router.post("/test-1", varifyLogin, (req, res) => {
   
    res.send("success")
    
});

router.post("/delete-coupon-cart/:id", varifyLogin, (req, res) => {
  offerHelpers.resetCoupon(req.params.id).then(() => {
    res.json({ deleted: true });
  });
});

 
//coupons
router.post("/apply-coupons", varifyLogin, async (req, res) => {
  await offerHelpers.checkCoupons(req.body.couponCode).then(async(coupon) => {
    let amount = await cartHelpers.getTotalAmount(req.session.user._id)
    if(amount<1000){
       res.json({ lessAmount: true });
    } else {
       console.log(amount);
       if (coupon.length > 0) {
         await offerHelpers
           .applyCoupons(req.body.couponCode, req.session.user._id)
           .then((data) => {
             if (data.applied) {
               res.json({ applied: true });
             } else {
               if (data.Already != true) {
                 req.session.discountedPrice = data[0].percentage;
                 res.json(data);
               } else {
                 console.log(data);
                 res.json(data);
               }
             }
           });
       } else {
         res.json({ status: true });
       }
    }
   

  })

});














module.exports = router;
