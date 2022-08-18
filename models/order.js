const mongoose = require('mongoose');

const Schema = mongoose.Schema;

 const Cart = mongoose.model("cart");


// order schema

const OrderSchema = new Schema({
    cart: Cart,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    cancellable: Boolean,
    status: String,
});


module.exports = Cart = mongoose.model('order', OrderSchema);
