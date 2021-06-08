const express = require("express");
const router = express.Router();
let {User}=require("../../models/user")
router.get("/",(req,res)=>{
    try{
    res.send(req.session)



}catch(e){
    console.log(e.message)
}
})

router.post("/register",async (req,res)=>{
    try{
    
const name=req.body.name;
const email=req.body.email;

let user=new User({name,email});
user=await user.save();
res.send(user);
    


}catch(e){
    console.log(e.message)
}
})

module.exports=router;