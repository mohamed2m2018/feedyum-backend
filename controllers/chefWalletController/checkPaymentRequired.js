const ChefWallet = require('../../models/chefWallet');
const { GRACE_PERIOD_DAYS } = require('../../config/feeConfig');

const checkPaymentRequired = async (req, res) => {
  try {
    const chefId = req.user._id;

    let wallet = await ChefWallet.findOne({ chef: chefId });
    
    if (!wallet) {
      wallet = new ChefWallet({ chef: chefId });
      await wallet.save();
    }

    // Recalculate payment status (in case of stale flags)
    wallet._updatePaymentStatus();
    await wallet.save();

    const paymentRequired = wallet.isPaymentRequired;
    const paymentDueAmount = paymentRequired ? Math.abs(wallet.balance) : 0;
    const isOrderBlocked = wallet.isOrderBlocked();

    // Calculate grace period info
    let isInGracePeriod = false;
    let gracePeriodEndsAt = null;
    if (wallet.gracePeriodStartDate && !paymentRequired) {
      isInGracePeriod = true;
      const endDate = new Date(wallet.gracePeriodStartDate);
      endDate.setDate(endDate.getDate() + GRACE_PERIOD_DAYS);
      gracePeriodEndsAt = endDate.toISOString();
    }

    res.json({
      success: true,
      paymentRequired,
      isOrderBlocked,
      isInGracePeriod,
      gracePeriodEndsAt,
      currentBalance: wallet.balance,
      paymentDueAmount,
      balanceInPounds: Math.abs(wallet.balance),
      message: paymentRequired 
        ? `Payment of ${paymentDueAmount.toFixed(2)} EGP is required to continue receiving orders`
        : isInGracePeriod
          ? `Your balance is 0. Top up before ${gracePeriodEndsAt} to avoid order blocking`
          : 'No payment required at this time'
    });

  } catch (error) {
    console.error('Check payment required error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
};

module.exports = checkPaymentRequired;