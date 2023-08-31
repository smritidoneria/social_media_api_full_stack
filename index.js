const express=require("express");
const app=express();
const mongoose=require("mongoose");
const dotenv=require("dotenv");
const helmet=require("helmet");
const userRoute=require("./routes/users");
const authRoute=require("./routes/auth");
const postRoute=require("./routes/posts");

dotenv.config();
mongoose.connect(process.env.MONGO_URL

).then(()=> console.log("connected successfully"))
.catch((err)=>{console.error(err);});

app.use(express.json());
app.use(helmet());
//app.use(morgon("common"));
app.use("/api/users",userRoute);
app.use("/api/auth",authRoute);
app.use("/api/posts",postRoute);

app.listen(3000,function(req,res)
{
  console.log("server is listening on port 300");
});
//mongodb+srv://smritidoneria:<password>@cluster0.ycaouqt.mongodb.net/?retryWrites=true&w=majority
