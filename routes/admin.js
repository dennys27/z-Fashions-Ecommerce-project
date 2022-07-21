var express = require('express');
// const { response } = require('../app');
 
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var itemHelpers = require('../helpers/product-management')
let userName = "admin"
let Pin = "admin123"
const store = require('../multer/multer')

/* GET users listing. */
router.get('/', function (req, res, next) {
  if (req.session.users) {
      res.redirect('/admin/view-users') 
  } else {
    res.render('admin/admin-login',{errout:req.session.err});
    req.session.err=false;
  }
})

router.get('/view-users',  (req, res, next)=> {
  if (req.session.users) {
    productHelpers.getAlluser().then((products)=>{
      res.render('admin/view-users', { admin: true, products })
     })
  } else {
    res.render('admin/admin-login',{errout:req.session.err,admin: true});
    req.session.err=false;
  }
})

router.get('/add-user', function (req, res) {
  if (req.session.users) {
  res.render('admin/add-user',{ admin: true})
  }else{
    res.redirect('/admin')
  }
})

router.post('/add-user', (req, res) => {
  productHelpers.doAdd(req.body).then((response) => {
        res.redirect('/admin')
  })
})
router.post('/view-users', (req, res) => {

  const { Email, Password } = req.body;
  if (userName === Email && Pin === Password) {
    req.session.check = true;
    req.session.users = {
      userName
    }
    productHelpers.getAlluser().then((products)=>{
      res.redirect('/admin/view-users')
     })
  }
  else {
    req.session.err="incorrect username or password"
    res.redirect('/admin')
  }
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/')
})
})
router.get('/update-user/:id',async(req,res)=>{
  if (req.session.users) {
    let user=await productHelpers.getProductDetails(req.params.id)
    res.render('admin/update-user',{user, admin: true})
    }else{
      res.redirect('/admin')
    }
  
})
router.post('/update-user/:id',(req,res)=>{

  productHelpers.updateUser(req.params.id,req.body).then((response)=>{
    res.redirect('/admin')
  })
})


//adding products

router.get("/add-products", (req, res) => {
     res.render("admin/add-products", { admin: true });
})

router.post("/add-item", store.array('image', 4), (req, res) => {
  console.log("im working");
  const files = req.files;
   console.log(files[0].originalname);
   console.log(req.body);

  if (!files) {
    const err = new Error("please choose the images");
    res.redirect("/add-products")
  }
  //res.render("admin/add-products", { admin: true });
  var filenames = req.files.map(function (file) {
    return file.filename;
  });

   req.body.Image = filenames;
   itemHelpers.addItem(req.body).then((resolve) => {
     res.redirect("/admin/add-products");
   });
  
  
  
});




router.get('/logout',(req,res)=>{
  req.session.users=null
  res.redirect('/admin')
})








module.exports = router;
