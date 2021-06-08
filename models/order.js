const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
 
//cart
orderItems:[{
    type:mongoose.Schema.Types.ObjectID,
    ref:'OrderItem',
    required:true
}],
shippingAddress:{
    type:String,
    required:true
},
city:{
    type:String,
    required:true
},
country:{
    type:String,
    required:true
},
phone:{
    type:String,
    // required:true

},
status:{
    type:String,
    default:'Pending'
},
totalPrice:{
    type:Number,
    // required:true
},
user:{
    type:mongoose.Schema.Types.ObjectID,
    ref:'User'
}
},{
    timestamps:true
})

exports.Order = mongoose.model('OrderItems', orderSchema);
