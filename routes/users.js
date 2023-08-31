const User=require("../models/User");
const router=require("express").Router();
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const express=require("express");
router.use(express.json());

let refreshTokens = [];

router.post("/api/refresh", (req, res) => {
  //take the refresh token from the user
  const refreshToken = req.body.token;

  //send error if there is no token or it's invalid
  if (!refreshToken) return res.status(401).json("You are not authenticated!");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!");
  }
  jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });

  //if everything is ok, create new access token, refresh token and send to user
});
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "5m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey");
};


//login a user
router.post("/login",async(req,res)=>
{
  try{
  const user=await User.findOne({email:req.body.email});
  !user && res.status(404).json("user not found");

  const validPassword=await bcrypt.compare(req.body.password, user.password)
  !validPassword&& res.status(400).json("wrong password");
  //generate a n access jsonwebtoken
  const accessToken=jwt.sign({id:user.id,isAdmin:user.isAdmin},"mySecretKey");
  const refreshToken=jwt.sign({id:user.id,isAdmin:user.isAdmin},"myRefreshSecretKey");
  res.json({
    username:user.username,
    isAdmin:user.isAdmin,
    accessToken,
    refreshToken
  });
}catch(err){
  console.log(err);
}
});

// update user
router.put("/:id", async(req,res)=>{
  if(req.body.userId=== req.params.id  ){
    if(req.body.password){
       try{
        const salt=await bcrypt.genSalt(10);
        req.body.password=await bcrypt.hash(req.body.password,salt);
      }catch(err){
        return res.status(500).json(err);
      }
    }
    try{
      const user=await User.findByIdAndUpdate(req.params.id,{
        $set:req.body,
      });
      res.status(200).json("updated!!");
    }catch(err){
      return res.status(500).json(err);
    }
  }
  else{
    return res.status(403).json("ypu can update only on your accout");
  }
});



//jwt token4
const verify=(req,res,next)=>{
  const authHeader=req.headers.authorization;
  if(authHeader){
    const token=authHeader.split(" ")[1];
    jwt.verify(token,"mySecretKey",(err,user)=>{
    if(err){
      return res.status(403).json("Token is not valid");
    }

    req.user=user;
    next();
  });
}else{
    res.status(401).json("not authenticated");
  }
};



//delete user
router.delete("/:id",verify ,async(req,res)=>{
  if(req.body.userId=== req.params.id || req.body.isAdmin){
    try{
      const user= await User.deleteOne({_id:req.params.id});
      res.status(200).json("account has been deleted");
    }catch(err){
      return res.status(500).json(err);
    }
  }
  else{
    return res.status(403).json("you can delte in your account only");
  }
});

router.post("/logout",verify,(req,res)=>{
  const refreshToken=req.body.token;
  refreshTokens=refreshTokens.filter((token)=>token!==refreshToken)
  res.status(200).json("you logged out succeddfully.");
});

// get a user
router.get("/:id", async(req,res)=>{
  try{
    const user=await User.findById(req.params.id);
    const {password, updatedAt,...other}=user._doc
    res.status(200).json(other);
  } catch(err){
    res.status(500).json(err);
  }
});
// follow a user
router.put("/:id/follow",async(req,res)=>{
  if(req.body.userId!==req.params.id){
    try{
      const user=await User.findById(req.params.id);
      const currentUser=await User.findById(req.body.userId);
      if(!user.followers.includes(req.body.userId)){
        await user.updateOne({$push:{followers:req.body.userId}});
        await currentUser.updateOne({$push:{followings:req.params.id}});
        res.status(200).json("user has been followed");
      }else{
        res.status(403).json("you already follow this user");
      }
    }catch(err){
      res.status(500).json(err);
    }
  }else{
    res.status(403).json("you can't follow yourself");
  }
});

//unfollow a user
router.put("/:id/unfollow",async(req,res)=>{
  if(req.body.userId!==req.params.id){
    try{
      const user=await User.findById(req.params.id);
      const currentUser=await User.findById(req.body.userId);
      if(user.followers.includes(req.body.userId)){
        await user.updateOne({$pull:{followers:req.body.userId}});
        await currentUser.updateOne({$pull:{followings:req.params.id}});
        res.status(200).json("user has been unfollowed");
      }else{
        res.status(403).json("you already unfollow this user");
      }
    }catch(err){
      res.status(500).json(err);
    }
  }else{
    res.status(403).json("you can't unfollow yourself");
  }
});
module.exports=router
