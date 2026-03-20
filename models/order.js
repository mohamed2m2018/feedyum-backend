const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  chef: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [{
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "dish", required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedOptions: [{
      groupName: String,
      optionNames: [String],
      totalAdjustment: Number,
    }],
    unitPrice: { type: Number },  // price at time of order (base + adjustments)
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
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  created_at: {
    type: Date,
    default: Date.now,
  },
  status: { type: String, default: "pending" },
  orderType: { type: String, enum: ['instant', 'scheduled', 'catering'], default: 'instant' },
  priceOfferRef: { type: mongoose.Schema.Types.ObjectId, ref: 'message', default: null }, // Link to price offer message for catering orders
  scheduledFor: { type: Date, default: null }, // null = instant order
  scheduledSlotLabel: { type: String, default: null }, // e.g. "10:00 AM – 12:00 PM"
  cancelledBy: { type: String, enum: ['user', 'chef', null], default: null },
  cancellationReason: { type: String, default: null },
  lastUpdated: { type: Date },
  statusHistory: [{
    status: String,
    changedTo: String,
    timestamp: Date,
    notes: String
  }],
  statusNotes: { type: String },
  estimatedDeliveryTime: { type: Date },
  // Tracking when user/chef last viewed this order (for unseen badge counts)
  userLastSeenAt: { type: Date, default: null },
  chefLastSeenAt: { type: Date, default: null },
  lastReminderSentAt: { type: Date, default: null },
  // Deposit tracking (snapshot from chef settings at order creation)
  depositRequired: { type: Boolean, default: false },
  depositAmount: { type: Number, default: 0 },
  depositInstapayHandle: { type: String, default: '' }, // Frozen chef InstaPay at order time
  depositInstapayType: { type: String, enum: ['phone', 'handle'], default: 'phone' }, // Type of InstaPay identifier
  depositConfirmedByChef: { type: Boolean, default: false },
  depositConfirmedAt: { type: Date, default: null },
  depositProofImage: { type: String, default: '' }, // Customer's payment proof screenshot URL
});

// Add indexes for better query performance
OrderSchema.index({ user: 1, created_at: -1 });
OrderSchema.index({ chef: 1, created_at: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ created_at: -1 });
OrderSchema.index({ scheduledFor: 1, status: 1 }); // For cron: activate scheduled orders

const Order = mongoose.model("order", OrderSchema);

module.exports = Order;
