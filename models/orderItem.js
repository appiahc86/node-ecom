const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
 
//cart
qty:{
    type:Number,
    required:true,
},
product:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
}
})

exports.OrderItem = mongoose.model('OrderItem', orderSchema);
