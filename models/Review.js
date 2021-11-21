const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    _id: {type: mongoose.Schema.Types.ObjectId},
    reviewDate: {type: Date, default: Date.now, required: true},
    product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    content: {type: String, required: true},
    stars: {type: String, required: true}
}, {timestamps: true} )


module.exports = mongoose.model('Review', ReviewSchema)