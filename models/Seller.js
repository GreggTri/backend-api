const mongoose = require('mongoose')

const SellerSchema = new mongoose.Schema({
    brandLogo: {type: String, require: true},
    brandName: { type: String, required: true, unique: true},
    ownerName: {type: String, required: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    EIN: {type: String, required: true, unique: true},
    cards: [{
        fullName: {type: String}, 
        number:{type: String },
        exp_date: {type: String},
        cvv: {type: Boolean, default: false}
    }],
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
    isVerified: {type: Boolean, default: false}

}, {timestamps: true} )


module.exports = mongoose.model('Seller', SellerSchema)