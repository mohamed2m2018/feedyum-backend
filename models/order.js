const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// order schema

const OrderSchema = new Schema({
  dishes: [
    new Schema({
      title: String,
      description: String,
      image: String,
      price: Number,
      quantity: Number,
    }),
  ],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  cancellable: Boolean,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  totalPrice: Number,
  service: String,
  tax: String,
  date : { type : Date, default: Date.now },
  status: {
    type: String,
    enum: [
      "Pending",
      "In Progress",
      "Rejected",
      "Delivered",
      "Cancelled",
      "Refunded",
    ],
  },
});

module.exports = Cart = mongoose.model("order", OrderSchema);
