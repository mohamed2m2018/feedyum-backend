const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// order schema

const OrderSchema = new Schema({
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'cart', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    cancellable: Boolean,
    status: String,
});


module.exports = Cart = mongoose.model('order', OrderSchema);
