const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    productImage: {type: String, required: true },
    productName: { type: String, required: true, unique: true},
    desc: {type: String, required: true},
    category: { type: String, required: true},
    price: { type: String, required: true},
    seller: {
        _id: {type: mongoose.Schema.Types.ObjectId, ref: 'Seller'},
        brandLogo: {type: String},
        brandName: {type: String},
        isVerified: {type: Boolean, default: false},
        customerService: {
            email: {type: String},
            phoneNumber: {type: String },
            return_policy: {type: String},
            warranty_policy: {type: String},
        },
    },
    colorway: [{
        _id: false,
        colorName: {type: String, required: true},
        hexcode: {type: String, required: true},
        model: {type: String, require: true}
    }],
    countInStock: {type: Number, default: 0},
}, {timestamps: true} )


module.exports = mongoose.model('Product', ProductSchema)
