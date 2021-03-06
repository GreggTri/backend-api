const mongoose = require('mongoose')

const SellerSchema = new mongoose.Schema({
    brandLogo: {type: String, require: true},
    brandName: { type: String, required: true, unique: true},
    ownerName: {type: String, required: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    customerService: {
        email: {type: String},
        phoneNumber:{type: String },
        return_policy: {type: String},
        warranty_policy: {type: String},
    },
    address: {
        street: {type: String},
        city:{type: String},
        state: {type: String},
        country: {type: String},
        zipcode: {type: String},
    },
    bankInfo: {
        accNumber: {type: String},
        routingNumber: {type: String}
    },
    isVerified: {type: Boolean, default: false},
    numOfProducts: {type: Number, required: true, default: 0},
    connect_stripe_id: {type: String},
    stripe_seller_customerId: {type: String}

}, {timestamps: true} )


module.exports = mongoose.model('Seller', SellerSchema)