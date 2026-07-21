const mongoose = require('mongoose');
const AmbassadorWallet = require('../../models/ambassadorWallet');
const User = require('../../models/user');

const transferToWallet = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const amount = Number(req.body.amount);
    const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey;
    if (!Number.isFinite(amount) || amount <= 0 || !idempotencyKey) {
      return res.status(400).json({ success: false, message: 'A positive amount and idempotency key are required' });
    }
    let wallet;
    let user;
    await session.withTransaction(async () => {
      const existing = await AmbassadorWallet.findOne({ user: req.user._id, 'transactions.idempotencyKey': idempotencyKey }).session(session);
      if (existing) { wallet = existing; user = await User.findById(req.user._id).session(session); return; }
      wallet = await AmbassadorWallet.findOneAndUpdate(
        { user: req.user._id, balance: { $gte: amount } },
        {
          $inc: { balance: -amount },
          $set: { lastTransferDate: new Date() },
          $push: { transactions: { type: 'transfer_to_wallet', amount: -amount, description: 'Transfer to app wallet', status: 'confirmed', timestamp: new Date(), idempotencyKey } },
        },
        { new: true, session },
      );
      if (!wallet) { const error = new Error('Insufficient ambassador wallet balance'); error.status = 409; throw error; }
      user = await User.findByIdAndUpdate(req.user._id, { $inc: { wallet: amount } }, { new: true, session });
      if (!user) throw new Error('User not found');
    });
    return res.json({ success: true, data: { ambassadorWalletBalance: wallet.balance, appWalletBalance: user.wallet, amountTransferred: amount } });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Failed to transfer to wallet' });
  } finally {
    await session.endSession();
  }
};

module.exports = transferToWallet;
