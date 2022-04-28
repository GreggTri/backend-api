const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    _id: {type: mongoose.Schema.Types.ObjectId},
    reviewDate: {type: Date, default: Date.now, required: true},
    product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    userFirstName: {type: String, required: true},
    userLastName: {type: String, required: true},
    content: {type: String, required: true},
    rating: {type: Number, required: true}
}, {timestamps: true} )


module.exports = mongoose.model('Review', ReviewSchema)
