var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
var itemHelpers = require("../helpers/product-management");
const userHelpers = require("../helpers/user-helpers");
const adminOrderHelper = require("../helpers/admin-order-helper");
const cartHelpers = require("../helpers/cart-helpers");
let userName = "admin";
let Pin = "admin123";
const store = require("../multer/multer");
const productManagement = require("../helpers/product-management");
const offerHelpers = require("../helpers/offerHelpers");



const varifyLogin = (req, res, next) => {
  if (req.session.users) {
    next();
  } else {
    res.render("admin/admin-login", { admin: true, errout: req.session.err });
    req.session.err = false;
  }
};


/* GET users listing. */
router.get("/", function (req, res, next) {
  if (req.session.users) {
    res.redirect("/admin/view-users");
  } else {
    res.render("admin/admin-login", { admin: false, errout: req.session.err });
    req.session.err = false;
  }
});

router.get("/view-users", varifyLogin, (req, res, next) => {
  productHelpers.getAlluser().then((products) => {
    res.render("admin/view-users", { admin: true, products });
  });
});



//admin- user full details
router.get("/view-user/:id", varifyLogin, (req, res, next) => {
  productHelpers.getProductDetails(req.params.id).then((user) => {
    console.log(user);
      res.render("admin/userprofile", { admin: true, user });
  })
  
  
});



router.get("/add-user", varifyLogin, function (req, res) {
  res.render("admin/add-user", { admin: true });
});

router.post("/add-user", (req, res) => {
  productHelpers.doAdd(req.body).then((response) => {
    res.redirect("/admin");
  });
});


router.post("/view-users", (req, res) => {
  const { Email, Password } = req.body;
  if (userName === Email && Pin === Password) {
    req.session.check = true;
    req.session.users = {
      userName,
    };
    productHelpers.getAlluser().then((products) => {
      res.redirect("/admin/view-users");
    });
  } else {
    req.session.err = "incorrect username or password";
    res.redirect("/admin");
  }
});


//user delete
router.get("/delete-product/:id", varifyLogin, (req, res) => {
  let proId = req.params.id;
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/");
  });
});

router.get("/update-user/:id", varifyLogin, async (req, res) => {
  let user = await productHelpers.getProductDetails(req.params.id);
  res.render("admin/update-user", { user, admin: true });
});

router.post("/update-user/:id", (req, res) => {
  productHelpers.updateUser(req.params.id, req.body).then((response) => {
    res.redirect("/admin");
  });
});

//product delete
router.get("/product-delete/:id", varifyLogin, (req, res) => {
  let proId = req.params.id;
  itemHelpers.deleteProduct(proId).then((response) => {
    res.redirect("/admin/view-products");
  });
});

//edit product
router.get("/edit-product/:id", varifyLogin, async (req, res) => {
  let editProduct = await itemHelpers.getProductData(req.params.id);
  let categories = await itemHelpers.getCategories();
  console.log(categories);
  res.render("admin/edit-product", {
    editProduct,
    categories,
    admin: true,
    adminHead: true,
  });
});

//edit-product-post
router.post("/product-edit/:id", varifyLogin,store.array("image", 4), async (req, res) => {
 
   const files = req.files;
   if (!files) {
     const err = new Error("please choose the images");
     res.redirect("/add-products", err);
   }
  
   //res.render("admin/add-products", { admin: true });
   var filenames = req.files.map(function (file) {
     return file.filename;
   });

   req.body.Image = filenames;

  let editProduct = await itemHelpers.updateProduct(req.params.id, req.body);
  res.render("admin/edit-product", {
    editProduct,
    admin: true,
    adminHead: true,
  });
});

//adding products

router.get("/add-products", varifyLogin, (req, res) => {
  itemHelpers.getCategories().then((cat) => {
    res.render("admin/add-products", { cat, admin: true });
  });
});

router.post("/add-item", store.array("image", 4), (req, res) => {
 
  const files = req.files;
  if (!files) {
    const err = new Error("please choose the images");
    res.redirect("/add-products", err);
  }


  //res.render("admin/add-products", { admin: true });
  var filenames = req.files.map(function (file) {
    return file.filename;
  });

  req.body.Image = filenames;
  itemHelpers.addItem(req.body).then((resolve) => {
    console.log(req.body);
    res.redirect("/admin/add-products");
  });
});




router.get("/add-categories", varifyLogin, (req, res) => {
  res.render("admin/Add-category", { admin: true });
});

router.get("/view-products", varifyLogin, (req, res) => { 
  itemHelpers.getAllproducts().then((products) => {
    res.render("admin/view-products", { admin: true, products });
  });
});



//categories
router.get("/categories", varifyLogin, (req, res) => {
  itemHelpers.getAllcategories().then((categories) => {
    res.render("admin/categories", { admin: true, categories });
  });
});


router.get("/delete-category/:id", varifyLogin, (req, res) => {
  itemHelpers.deleteCategory(req.params.id).then((categories) => {
    res.redirect("/admin/categories",);
  });
});



router.post("/add-category", (req, res) => {
  console.log(req.body);
  itemHelpers.addCategory(req.body);
  res.redirect("/admin/add-categories");
});



router.get("/edit-categories/:id", varifyLogin, (req, res) => {
  itemHelpers.getCategory(req.params.id).then((category) => {
    res.render("admin/editCat", { category });
  });
});





//admin-orders-listing

router.get("/admin-orders", varifyLogin, (req, res) => {
  adminOrderHelper.getOrders().then((Items) => {
    const reversed = Items.reverse()
    Items = reversed;
      res.render("admin/admin-orders", { admin: true,Items });
 })
});

router.post("/change-order-status/:id", varifyLogin, (req, res) => {
  adminOrderHelper.changeOrderStatus(req.params.id, req.body.status).then((data) => {
      res.json({data})
    })
});


//admin-view - order details
router.get("/admin-view-order-details/:id", varifyLogin, async (req, res) => {
  let products = await cartHelpers.getOrderProducts(req.params.id);
  let orderDetails = await cartHelpers.getInvoice(req.params.id);
  res.render("admin/invoice", { admin: true, products, orderDetails });
});



router.post("/edit-category/:id", (req, res) => {
  itemHelpers.updateCategory(req.params.id, req.body);
 res.redirect("/admin/categories");
});

router.post("/add-category", (req, res) => {
  itemHelpers.addCategory(req.body);
  res.redirect("/admin/add-categories");
});

router.get("/coupons-management",varifyLogin, async(req, res) => {
  await offerHelpers.getCoupons().then((coupons) => {
     res.render("admin/coupons", { admin: true,coupons });
  })
});

router.get("/add-coupons",varifyLogin, (req, res) => {
  res.render("admin/add-coupons", { admin: true });
});

//coupons
router.post("/add-coupons",varifyLogin, (req, res) => {
  offerHelpers.addCoupons(req.body).then((data) => {
    res.json(data)
 })
});

router.post("/delete-coupons", varifyLogin, (req, res) => {
  offerHelpers.deleteCoupon(req.body.uId).then((data) => {
    console.log(data);
    res.json(data)
  })
 
});






router.get("/Block-user/:id", varifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers.blockUser(userId).then((response) => {
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/admin/view-users");
  });
});

router.get("/Un-Block-user/:id", varifyLogin, (req, res) => {
  let userId = req.params.id;
  userHelpers.unBlockUser(userId).then((response) => {
    req.session.user = null;
    req.session.loggedIn = null;
    res.redirect("/admin/view-users");
  });
}); 

router.get("/logout", varifyLogin, (req, res) => {
  req.session.users = null;
  res.redirect("/admin");
});




//admin dashboard  
router.get("/dashboard", varifyLogin, async(req, res) => {
  let cod =await adminOrderHelper.codTotal()
  let razorpay = await adminOrderHelper.razorTotal();
  let paypal = await adminOrderHelper.paypalTotal();
  let orders = await adminOrderHelper.getOrders();
  let total = orders.length
  let clients = await productHelpers.getAlluser();
  let users = clients.length;
  let weekly = 0;
  let monthly = 0;
  let yearly = 0;
  productManagement.getGraphDetails().then(async(data) => {
    let temp = data;
    // console.log(temp);
    await temp.map((det) => {
     
      if (det.status != "cancelled") {
        weekly = weekly + det.totalAmount;
      }
    });

    productManagement.getMonthDetails().then(async (msales) => {
    let temp2 = msales
      await temp2.map((det) => {
       
        if (det.status != "cancelled") {
          monthly = monthly + det.totalAmount;
        }
      });
      
    })
    productManagement.getYearDetails().then(async (ysales) => {
      let temp3 = ysales; 
      await temp3.map((det) => {
        if (det.status != "cancelled") {
          yearly = yearly + det.totalAmount;
        }
      });
      
    });

    console.log(await adminOrderHelper.test()); 

    //first try
    await adminOrderHelper.getLastweekOrders().then((response) => {
      res.render("admin/dashboard", {
        admin: true,
        cod,
        razorpay,
        paypal,
        total,
        users,
        weekly,
        monthly,
        yearly,
      });
    });
  });


}),
  



module.exports = router;
