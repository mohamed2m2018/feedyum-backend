const mongoose = require("mongoose");

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
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Method to add service fee transaction
ChefWalletSchema.methods.addServiceFee = function (orderId, orderAmount) {
  const serviceFeeAmount = orderAmount * 0.05; // 5% service fee

  this.transactions.push({
    type: 'service_fee',
    amount: -serviceFeeAmount, // Negative because it's deducted
    orderId: orderId,
    description: `Service fee (5%) for order ${orderId}`,
    timestamp: new Date()
  });

  this.balance -= serviceFeeAmount;

  // Check if payment is required (balance < -2000)
  if (this.balance < -2000) {
    this.isPaymentRequired = true;
    this.paymentDueAmount = Math.abs(this.balance);
  }

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

  // Reset payment requirement if balance is above -2000
  if (this.balance >= -2000) {
    this.isPaymentRequired = false;
    this.paymentDueAmount = 0;
  }

  return this.save();
};

// Method to refund service fee when order is cancelled by user
ChefWalletSchema.methods.refundServiceFee = function (orderId, orderAmount) {
  const serviceFeeAmount = orderAmount * 0.05; // 5% service fee to refund

  this.transactions.push({
    type: 'refund',
    amount: serviceFeeAmount, // Positive because it's being returned
    orderId: orderId,
    description: `Service fee refund for cancelled order ${orderId}`,
    timestamp: new Date()
  });

  this.balance += serviceFeeAmount;

  // Reset payment requirement if balance is above -2000
  if (this.balance >= -2000) {
    this.isPaymentRequired = false;
    this.paymentDueAmount = 0;
  }

  return this.save();
};

const ChefWallet = mongoose.model("chefwallet", ChefWalletSchema);

module.exports = ChefWallet;