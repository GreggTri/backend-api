const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    orderedProducts: [{
        _id: false,
        productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
        productImage: {type: String, required: true},
        productName: {type: String, required: true},
        brandName: {type: String, required: true},
        colorName: {type: String, required: true},
        price: {type: String, required: true},
        quantity: {type: Number, required: true},
        trackingId: {type: String, required: true},
        status: {type: String, required: true}
    }],
    address: {
        street: {type: String, required: true},
        city:{type: String, required: true},
        state: {type: String, required: true},
        zipcode: {type: String, required: true},
    },
    subtotal: {type: String, required: true},
    tax: {type: String, required: true},
    purchaseDate: {type: Date, required: true},
}, {timestamps: true} )


module.exports = mongoose.model('Order', OrderSchema)
