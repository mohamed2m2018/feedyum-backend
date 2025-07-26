const ChefWallet = require('../../models/chefWallet');

const checkPaymentRequired = async (req, res) => {
  try {
    const chefId = req.user._id;

    // Find chef wallet
    let wallet = await ChefWallet.findOne({ chef: chefId });
    
    if (!wallet) {
      wallet = new ChefWallet({ chef: chefId });
      await wallet.save();
    }

    const paymentRequired = wallet.balance < -2000;
    const paymentDueAmount = paymentRequired ? Math.abs(wallet.balance) : 0;

    // Update wallet if payment requirement status changed
    if (wallet.isPaymentRequired !== paymentRequired) {
      wallet.isPaymentRequired = paymentRequired;
      wallet.paymentDueAmount = paymentDueAmount;
      await wallet.save();
    }

    res.json({
      success: true,
      paymentRequired,
      currentBalance: wallet.balance,
      paymentDueAmount,
      balanceInPounds: Math.abs(wallet.balance),
      message: paymentRequired 
        ? `Payment of £${paymentDueAmount.toFixed(2)} is required to continue receiving orders`
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