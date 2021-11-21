const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    productImage: {type: String, required: true },
    productName: { type: String, required: true, unique: true},
    desc: {type: String, required: true},
    category: { type: String, required: true},
    price: { type: String, required: true},
    seller: {
        brand_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Seller'},
        brandLogo: {type: String},
        brandName: {type: String},
        customerService: {
            email: {type: String},
            phoneNumber: {type: String },
            return_policy: {type: String},
            warranty_policy: {type: String},
        },
    },
    colorway: [{
        colorName: {type: String, required: true},
        hexcode: {type: String, required: true},
        model: {type: String, require: true}
    }, { _id : false }],
    countInStock: {type: Number, default: 0},
}, {timestamps: true} )


module.exports = mongoose.model('Product', ProductSchema)