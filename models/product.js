const mongoose = require('mongoose');
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const productSchema = mongoose.Schema({
name: {
    type:String,
    required: true,
},
description: {
    type:String,
    required: true,
},
richDescription:{
       type:String,
        required: true,
        default:"no rich description"
},

price:{
   type:Number,
   default:0, 
},
category:{
    type:mongoose.Schema.Types.ObjectID,
    ref:'Category',
    required:true
},
countInStock: {
    type: Number,
    // required: true,
    min:0,
    max:50000

},

isFeatured:{
    type:Boolean,
    default:false,
},

viewCount:{
    type:Number,
    default:0,
    immutable:false
},
worth:{
    type:String,
    default:"New"
},
image: [{
    type:String,
    required: false ,
}
],
slug: {
    type: String,
    unique: true,
    slug: "name",
  },

},
{timestamps:true},
)

module.exports = mongoose.model('Product', productSchema);
