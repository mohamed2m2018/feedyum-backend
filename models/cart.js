const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "dish", required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Cart = mongoose.model("cart", CartSchema);
module.exports = Cart