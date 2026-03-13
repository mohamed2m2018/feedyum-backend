const mongoose = require("mongoose");
const { CHEF_ORDER_FEE, GRACE_PERIOD_DAYS } = require("../config/feeConfig");

const ChefWalletSchema = new mongoose.Schema({
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0 // Negative balance means chef owes money to platform
  },
  transactions: [{
    type: {
      type: String,
      enum: ['service_fee', 'payment_to_platform', 'adjustment', 'initial_bonus', 'refund'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order"
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastPaymentDate: Date,
  paymentDueAmount: {
    type: Number,
    default: 0
  },
  isPaymentRequired: {
    type: Boolean,
    default: false
  },
  // When balance first drops to ≤ 0, this date is set.
  // After GRACE_PERIOD_DAYS, orders are blocked until chef tops up.
  gracePeriodStartDate: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Update grace period and payment requirement flags based on current balance.
 * Called internally after any balance change.
 */
ChefWalletSchema.methods._updatePaymentStatus = function () {
  if (this.balance <= 0) {
    // Start grace period if not already started
    if (!this.gracePeriodStartDate) {
      this.gracePeriodStartDate = new Date();
    }

    // Check if grace period has expired
    const now = new Date();
    const gracePeriodEnd = new Date(this.gracePeriodStartDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

    if (now >= gracePeriodEnd) {
      this.isPaymentRequired = true;
      this.paymentDueAmount = Math.abs(this.balance);
    }
  } else {
    // Balance is positive — clear all flags
    this.gracePeriodStartDate = null;
    this.isPaymentRequired = false;
    this.paymentDueAmount = 0;
  }
};

/**
 * Check if orders should be blocked for this chef.
 * Can be called without saving (read-only check).
 * @returns {boolean}
 */
ChefWalletSchema.methods.isOrderBlocked = function () {
  if (this.balance > 0) return false;
  if (!this.gracePeriodStartDate) return false;

  const now = new Date();
  const gracePeriodEnd = new Date(this.gracePeriodStartDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  return now >= gracePeriodEnd;
};

// Method to deduct flat platform order fee from chef wallet
ChefWalletSchema.methods.addServiceFee = function (orderId) {
  const feeAmount = CHEF_ORDER_FEE; // Flat fee per order

  this.transactions.push({
    type: 'service_fee',
    amount: -feeAmount, // Negative because it's deducted
    orderId: orderId,
    description: `Platform order fee (${feeAmount} EGP) for order ${orderId}`,
    timestamp: new Date()
  });

  this.balance -= feeAmount;
  this._updatePaymentStatus();

  return this.save();
};

// Method to process payment to platform
ChefWalletSchema.methods.processPayment = function (amount, description = 'Payment to platform') {
  this.transactions.push({
    type: 'payment_to_platform',
    amount: amount, // Positive because it's a payment
    description: description,
    timestamp: new Date()
  });

  this.balance += amount;
  this.lastPaymentDate = new Date();
  this._updatePaymentStatus();

  return this.save();
};

// Method to refund platform order fee when order is cancelled
ChefWalletSchema.methods.refundServiceFee = function (orderId) {
  const feeAmount = CHEF_ORDER_FEE; // Flat fee to refund

  this.transactions.push({
    type: 'refund',
    amount: feeAmount, // Positive because it's being returned
    orderId: orderId,
    description: `Platform fee refund (${feeAmount} EGP) for cancelled order ${orderId}`,
    timestamp: new Date()
  });

  this.balance += feeAmount;
  this._updatePaymentStatus();

  return this.save();
};

const ChefWallet = mongoose.model("chefwallet", ChefWalletSchema);

module.exports = ChefWallet;