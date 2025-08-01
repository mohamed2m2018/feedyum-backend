const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  chef: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "dish", required: true },
    quantity: { type: Number, required: true, default: 1 }
  }],
  totalPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  promocode: {
    code: String,
    discountAmount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['percentage', 'fixed'] }
  },
  deliveryAddress: {
    nameLine: String,
    location: {
      lat: String,
      long: String,
    },
    isPrimary: Boolean,
  },
  specialInstructions: { type: String, default: "" },
  created_at: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, default: "pending" },
});

// Add indexes for better query performance
OrderSchema.index({ user: 1, created_at: -1 });
OrderSchema.index({ chef: 1, created_at: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ created_at: -1 });

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
