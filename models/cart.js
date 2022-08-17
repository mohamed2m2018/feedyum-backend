const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// cart schema

const CartSchema = new Schema({
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'story', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    quantity: String
});


module.exports = Cart = mongoose.model('cart', CartSchema);
