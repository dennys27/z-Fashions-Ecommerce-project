var express = require('express');
const session = require('express-session');
const { response } = require('../app');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
var productHelpers = require("../helpers/product-helpers");

var serviceSID = 'VAa0b257654fed1cfb2277d0e0cd8993ca';
var accountSid = 'AC32a003cd12ae3130f9f3f04d1e3bbef5';
var authToken = 'f8002a0990a9e403a35adcf3d0ffb163';

const client = require("twilio")(accountSid, authToken, {
  lazyLoading: true,
});

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user;
 
  let U_session = req.session;
   userHelpers.isExist(U_session)

  // if (userHelpers.isExist(user) === "invalid") {
  //   req.session.destroy((err) => {
  //     console.log("error occured during session destruction");
  //   });
  // }

   productHelpers.getAlluser().then((products) => {
      res.render("index", { products, user });
   });
  

});


router.get('/login', function (req, res) {
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginerr":req.session.loginErr})
    req.session.loginErr=false
  }
 
})


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
  
  console.log(req.body);

  // client.verify.services(serviceSID).verifications.create({
  //   to: `+916282831097`,
  //   channel: "sms",
  // });
   
   // res.redirect("/");
    res.redirect("/otp-veri");
   
  
});

router.post("/otp-matching", function (req, res) {
  
 
   // res.redirect("/");
  //  res.render("user/otp-veri");
   
  
});







router.get('/signup', function (req, res) {
  if (req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/signup',{signerr:req.session.signErr})
    req.session.signErr=false
  }
})




router.post('/signup', (req, res) => {
 userHelpers.doSignup(req.body).then((response)=>{
  if (response.status){
    req.session.signErr=true
    res.redirect('/signup')
  }else{
  res.redirect('/login')
  }
 })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if (response.status){
     
      req.session.user=response.user
      req.session.loggedIn=true
      res.redirect('/')
    }else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.loggedIn=null
  req.session.user=null
  res.redirect('/')
})
module.exports = router;
