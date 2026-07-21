const mongoose = require("mongoose");
const { COMMISSION_GRACE_PERIOD_HOURS, getAmbassadorLevel } = require("../config/missionConfig");

const AmbassadorWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
  },
  balance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  lifetimeEarnings: { type: Number, default: 0 },

  transactions: [{
    type: {
      type: String,
      enum: [
        'scout_bonus',
        'review_commission',
        'milestone_bonus',
        'adjustment',
        'commission_reversal',
        'transfer_to_wallet',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: "mission" },
    participationId: { type: mongoose.Schema.Types.ObjectId, ref: "missionParticipation" },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'reversed'],
      default: 'confirmed',
    },
    gracePeriodEnds: Date,
    idempotencyKey: String,
    timestamp: { type: Date, default: Date.now },
  }],

  lastTransferDate: Date,
  created_at: { type: Date, default: Date.now },
});

AmbassadorWalletSchema.index({ user: 1 }, { unique: true });
AmbassadorWalletSchema.index({ 'transactions.orderId': 1 });
AmbassadorWalletSchema.index({ 'transactions.status': 1, 'transactions.gracePeriodEnds': 1 });
AmbassadorWalletSchema.index({ 'transactions.idempotencyKey': 1 });

AmbassadorWalletSchema.methods.addScoutBonus = function (missionId, participationId, amount, description, idempotencyKey) {
  if (idempotencyKey && this.transactions.some(tx => tx.idempotencyKey === idempotencyKey)) {
    return Promise.resolve(this);
  }
  this.transactions.push({
    type: 'scout_bonus',
    amount,
    missionId,
    participationId,
    description: description || `Scout bonus for mission`,
    status: 'confirmed',
    idempotencyKey,
    timestamp: new Date(),
  });

  this.balance += amount;
  this.lifetimeEarnings += amount;

  return this.save();
};

AmbassadorWalletSchema.methods.addCommission = function (orderId, missionId, participationId, amount) {
  const gracePeriodEnds = new Date();
  gracePeriodEnds.setHours(gracePeriodEnds.getHours() + COMMISSION_GRACE_PERIOD_HOURS);

  this.transactions.push({
    type: 'review_commission',
    amount,
    orderId,
    missionId,
    participationId,
    description: `Commission from order`,
    status: 'pending',
    gracePeriodEnds,
    timestamp: new Date(),
  });

  this.pendingBalance += amount;

  return this.save();
};

AmbassadorWalletSchema.methods.confirmPendingCommission = function (transactionIndex) {
  const tx = this.transactions[transactionIndex];
  if (!tx || tx.status !== 'pending') return this;

  tx.status = 'confirmed';
  this.pendingBalance -= tx.amount;
  this.balance += tx.amount;
  this.lifetimeEarnings += tx.amount;

  return this.save();
};

AmbassadorWalletSchema.methods.reverseCommission = function (orderId, reason) {
  const txIndex = this.transactions.findIndex(
    t => t.orderId?.toString() === orderId.toString() &&
         t.type === 'review_commission' &&
         t.status !== 'reversed'
  );

  if (txIndex === -1) return this;

  const tx = this.transactions[txIndex];
  const wasPending = tx.status === 'pending';

  tx.status = 'reversed';

  this.transactions.push({
    type: 'commission_reversal',
    amount: -tx.amount,
    orderId,
    missionId: tx.missionId,
    participationId: tx.participationId,
    description: reason || 'Order cancelled',
    status: 'confirmed',
    timestamp: new Date(),
  });

  if (wasPending) {
    this.pendingBalance -= tx.amount;
  } else {
    this.balance -= tx.amount;
    this.lifetimeEarnings -= tx.amount;
  }

  return this.save();
};

AmbassadorWalletSchema.methods.addMilestoneBonus = function (missionId, participationId, amount, description, idempotencyKey) {
  if (idempotencyKey && this.transactions.some(tx => tx.idempotencyKey === idempotencyKey)) {
    return Promise.resolve(this);
  }
  this.transactions.push({
    type: 'milestone_bonus',
    amount,
    missionId,
    participationId,
    description: description || 'Milestone bonus',
    status: 'confirmed',
    idempotencyKey,
    timestamp: new Date(),
  });

  this.balance += amount;
  this.lifetimeEarnings += amount;

  return this.save();
};

AmbassadorWalletSchema.methods.transferToAppWallet = function (amount) {
  if (amount <= 0 || amount > this.balance) return null;

  this.transactions.push({
    type: 'transfer_to_wallet',
    amount: -amount,
    description: 'Transfer to app wallet',
    status: 'confirmed',
    timestamp: new Date(),
  });

  this.balance -= amount;
  this.lastTransferDate = new Date();

  return this.save();
};

AmbassadorWalletSchema.methods.getAmbassadorLevel = function () {
  return getAmbassadorLevel(this.lifetimeEarnings);
};

const AmbassadorWallet = mongoose.model("ambassadorWallet", AmbassadorWalletSchema);

module.exports = AmbassadorWallet;
