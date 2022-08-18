const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// order schema

const OrderSchema = new Schema({
    cart: new Schema({
        story: { type: mongoose.Schema.Types.ObjectId, ref: 'story', required: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
        quantity: String
    }),
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    cancellable: Boolean,
    status: String,
});


module.exports = Cart = mongoose.model('order', OrderSchema);
