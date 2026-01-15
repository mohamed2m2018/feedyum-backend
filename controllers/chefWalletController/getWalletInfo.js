const ChefWallet = require('../../models/chefWallet');

const getWalletInfo = async (req, res) => {
  try {
    const chefId = req.params.chefId || req.user._id;

    // Find or create wallet for chef
    let wallet = await ChefWallet.findOne({ chef: chefId })
      .populate('chef', 'fullName username avatar')
      .populate('transactions.orderId', 'totalPrice created_at');

    if (!wallet) {
      wallet = new ChefWallet({
        chef: chefId,
        balance: 500, // Initial balance from platform
        transactions: [{
          type: 'initial_bonus',
          amount: 500,
          description: 'Welcome bonus from platform',
          timestamp: new Date()
        }]
      });
      await wallet.save();
      await wallet.populate('chef', 'fullName username avatar');
    } else {
      // Check if existing wallet has initial_bonus, if not add it
      const hasInitialBonus = wallet.transactions.some(t => t.type === 'initial_bonus');
      if (!hasInitialBonus) {
        wallet.transactions.push({
          type: 'initial_bonus',
          amount: 500,
          description: 'Welcome bonus from platform',
          timestamp: new Date()
        });
        wallet.balance += 500;
        await wallet.save();
      }
    }

    // Calculate summary statistics
    const totalServiceFees = wallet.transactions
      .filter(t => t.type === 'service_fee')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPayments = wallet.transactions
      .filter(t => t.type === 'payment_to_platform')
      .reduce((sum, t) => sum + t.amount, 0);

    const recentTransactions = wallet.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      wallet: {
        ...wallet.toObject(),
        transactions: recentTransactions
      },
      summary: {
        currentBalance: wallet.balance,
        totalServiceFees,
        totalPayments,
        isPaymentRequired: wallet.isPaymentRequired,
        paymentDueAmount: wallet.paymentDueAmount,
        lastPaymentDate: wallet.lastPaymentDate
      }
    });

  } catch (error) {
    console.error('Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet information',
      error: error.message
    });
  }
};

module.exports = getWalletInfo;