const router=require("express").Router();
const User=require("../models/User");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
//create user
router.post("/register",async(req,res)=>
{
//save user and respojn
try{
  const salt=await bcrypt.genSalt(10);
  const hashedPassword=await bcrypt.hash(req.body.password, salt);
  const newUser= new User({
    username:req.body.username,
    email:req.body.email,
    password:hashedPassword,

  });

  const user=await newUser.save();
  res.status(200).json(user);
}
catch(err)
{
  console.log(err);
}
  //console.log("d");

});

//login



module.exports=router;
