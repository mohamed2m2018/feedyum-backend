const ChefWallet = require('../models/chefWallet');

const checkChefPaymentStatus = async (req, res, next) => {
  try {
    // Only check for chef users
    if (req.user && req.user.type === 'chef') {
      const chefId = req.user._id;
      
      // Find or create chef wallet
      let wallet = await ChefWallet.findOne({ chef: chefId });
      if (!wallet) {
        wallet = new ChefWallet({ chef: chefId });
        await wallet.save();
      }

      // Use the model's built-in logic: balance <= 0 + grace period expired
      wallet._updatePaymentStatus();
      await wallet.save();

      if (wallet.isOrderBlocked()) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          message: 'Payment required to continue receiving orders',
          paymentDueAmount: wallet.paymentDueAmount,
          currentBalance: wallet.balance,
          walletInfo: {
            balance: wallet.balance,
            paymentDueAmount: wallet.paymentDueAmount,
            isPaymentRequired: wallet.isPaymentRequired
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Chef payment status check error:', error);
    // Don't block the request if there's an error checking payment status
    next();
  }
};

module.exports = checkChefPaymentStatus;