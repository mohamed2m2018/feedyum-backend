const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "dish", required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedOptions: [{
      groupName: String,        // "Size"
      optionNames: [String],    // ["Large"] for single, ["Cheese", "Bacon"] for multiple
      totalAdjustment: Number,  // sum of priceAdjustments for this group
    }],
    unitPrice: { type: Number },  // base price + all adjustments (for display)
    cartItemKey: { type: String }, // composite key: `${dishId}_${hash(selectedOptions)}`
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Cart = mongoose.model("cart", CartSchema);
module.exports = Cart