const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    cart: {type: Object, required: true},
    address: {type: String, required: true},
    paymentId: {type: String, required: true},
}, {timestamps: true} )


module.exports = mongoose.model('Order', OrderSchema)