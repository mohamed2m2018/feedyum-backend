const ChefWallet = require('../../models/chefWallet');

const processPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId } = req.body;
    const chefId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required'
      });
    }

    // Find chef wallet
    let wallet = await ChefWallet.findOne({ chef: chefId });
    
    if (!wallet) {
      wallet = new ChefWallet({ chef: chefId });
      await wallet.save();
    }

    // Process the payment
    const description = `Payment via ${paymentMethod || 'unknown method'}${transactionId ? ` (${transactionId})` : ''}`;
    await wallet.processPayment(amount, description);

    // Populate chef info for response
    await wallet.populate('chef', 'fullName username avatar');

    res.json({
      success: true,
      message: 'Payment processed successfully',
      wallet: {
        balance: wallet.balance,
        isPaymentRequired: wallet.isPaymentRequired,
        paymentDueAmount: wallet.paymentDueAmount,
        lastPaymentDate: wallet.lastPaymentDate
      }
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

module.exports = processPayment;