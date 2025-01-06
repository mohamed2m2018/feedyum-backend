const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "dish", required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  totalPrice: { type: Number, required: true },
  created_at: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, default: "pending" },
});

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
