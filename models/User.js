const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: {type: String, require: true},
    lastName: { type: String, required: true, unique: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true},
    lastActive: {type: Date, default: Date.now},
    cards: [{
        fullName: {type: String}, 
        number:{type: String },
        exp_date: {type: String},
        cvv: {type: Boolean, default: false},
    }],
    address: {
        street: {type: String},
        city:{type: String},
        state: {type: String},
        zipcode: {type: String},
    },
    favorites: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product'}
    }],
    cart: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
        quantity: {type: Number, default: 1}
    }]
}, {timestamps: true} )


module.exports = mongoose.model('User', UserSchema)