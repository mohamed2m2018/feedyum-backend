const mongoose = require("mongoose");

const PaymobTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    // Amount in piasters (cents) sent to Paymob
    amountCents: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: "EGP",
    },
    paymobOrderId: {
        type: String,
    },
    paymobTransactionId: {
        type: String,
    },
    clientSecret: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "success", "failed", "refunded"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        default: "card",
    },
    callbackData: {
        type: mongoose.Schema.Types.Mixed,
    },
    description: {
        type: String,
        default: "Wallet top-up",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

// Index for quick lookups
PaymobTransactionSchema.index({ user: 1, created_at: -1 });
PaymobTransactionSchema.index({ paymobOrderId: 1 });
PaymobTransactionSchema.index({ paymobTransactionId: 1 });

const PaymobTransaction = mongoose.model("paymobtransaction", PaymobTransactionSchema);

module.exports = PaymobTransaction;
