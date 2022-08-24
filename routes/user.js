var express = require("express");
require("dotenv").config();
var router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const productHelpers = require("../helpers/product-management");
const cartHelpers = require("../helpers/cart-helpers");
const paypal = require("paypal-rest-sdk");
const offerHelpers = require("../helpers/offerHelpers");
const { Db } = require("mongodb");
const referralCodeGenerator = require("referral-code-generator");

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
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/otp");
    req.session.loginErr = false;
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
  productHelpers.getProductData(req.params.id).then((Product) => {
   
    res.render("user/product-view", { guestuser, Product, userHead: true });
  });
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

      let actual ;
      if (coupDetails[0]) {
         if (coupDetails[0].cpn) {
           //console.log(coupDetails[0].couponDiscount);
           let discount =
             (parseInt(total) * parseInt(coupDetails[0].couponDiscount)) / 100;
           actual = discount;
           total = parseInt(total - discount);
         } else if (coupDetails.ncpn) {
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

router.post("/change-product-quantity", varifyLogin, (req, res) => {
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    let total = await cartHelpers.getTotalAmount(req.session.user._id);

    if (total > 0) {
      response.total = total;
    }

    let details = await cartHelpers.getCartProducts(req.session.user._id)
 
    for (i = 0; i < details.length; i++) {
      if (details[i].product._id == req.body.product) {
        response.productId = req.body.product;
        response.quantity = details[i].quantity;
        response.subtotal = details[i].product.price * details[i].quantity;
      }
    }
    console.log(response);
    res.json(response);
  });
}); 

router.get("/checkout", varifyLogin, async (req, res) => {
  let user = req.session.user;
  let defaultAddress;
  let total = await cartHelpers.getTotalAmount(req.session.user._id);
  let totalPrice = await cartHelpers.getTotalAmount(req.session.user._id);
  if (totalPrice > 0) {
    let userAd = await userHelpers.getUserDetails(req.session.user._id);
  
    if (userAd.deliveryAddress) {
      userAd.deliveryAddress.map((data) => {
        if (data.default == true) {
          defaultAddress = data;
        }
      });
    }

    res.render("user/checkout", { user,userAd, defaultAddress, total, Empty: false });
  } else {
    res.render("user/Cart", { user, emptyCart: true });
  }
});



//payment gateway

router.post("/checkout-form", varifyLogin, async (req, res) => {
  let user = req.session.user._id;
  let products = await cartHelpers.getCartProductList(req.body.userId);
  let totalPrice = await cartHelpers.getTotalAmount(req.body.userId);
  
 await cartHelpers.getDiscount(user).then((discountedPrice) => {
   if (discountedPrice.code) {
     totalPrice = totalPrice - (discountedPrice.couponDiscount * totalPrice) / 100
   }
 });
  
  req.session.total = totalPrice
  if (totalPrice > 0){
     cartHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
       req.session.orderId = response.insertedId.toString();

       if (req.body["PaymentMethod"] == "COD") {
         cartHelpers.deleteCart(req.session.user._id);
         
         res.json({ codSuccess: true });
       } else if (req.body["PaymentMethod"] == "RazorPay") {
       
         cartHelpers.getOrderId(user).then((orderDetails) => {
           req.session.uniqueOrder=orderDetails._id
           userHelpers.generateRazorPay(response.insertedId.toString(), totalPrice)
             .then((data) => {
               data.razorpay = true;
               res.json(data);
             });
         });
       } else if (req.body["PaymentMethod"] == "PayPal") {
         userHelpers.converter(totalPrice).then((price) => {
           let converted = parseInt(price)
           cartHelpers.getOrderId(user).then((orderDetails) => {
              
              userHelpers
                .generatePayPal(orderDetails._id.toString(), converted)
                .then((data) => {
                 
                  res.json(data);
                });
            });
         })
        
       }
     }); 

  } else {
     res.json({cempty:true});
  }
 

  //res.render("user/checkout", { user,total });
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
  let orderDetails = await cartHelpers.getInvoice(req.params.id);
 // console.log(req.params.id);
  console.log(orderDetails);
  res.render("user/invoice", { user, products,orderDetails });
});

//user profile
router.get("/my-account/:id", varifyLogin, (req, res) => { 
  let user = req.session.user;
  
  // userHelpers.getUserDetails(user._id).then((data) => {
  //   res.render("user/user-account", { user, data });
  // });
  let userId = req.params.id;
  res.render("user/youraccount",{user,userId})
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
