const ChefWallet = require('../../models/chefWallet');
const { CHEF_ORDER_FEE, INITIAL_WELCOME_CREDIT, GRACE_PERIOD_DAYS } = require('../../config/feeConfig');

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
        balance: INITIAL_WELCOME_CREDIT,
        transactions: [{
          type: 'initial_bonus',
          amount: INITIAL_WELCOME_CREDIT,
          description: 'Welcome credit from platform',
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
          amount: INITIAL_WELCOME_CREDIT,
          description: 'Welcome credit from platform',
          timestamp: new Date()
        });
        wallet.balance += INITIAL_WELCOME_CREDIT;
        await wallet.save();
      }
    }

    // Recalculate payment status
    wallet._updatePaymentStatus();
    await wallet.save();

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

    // Grace period info
    let isInGracePeriod = false;
    let gracePeriodEndsAt = null;
    if (wallet.gracePeriodStartDate && !wallet.isPaymentRequired) {
      isInGracePeriod = true;
      const endDate = new Date(wallet.gracePeriodStartDate);
      endDate.setDate(endDate.getDate() + GRACE_PERIOD_DAYS);
      gracePeriodEndsAt = endDate.toISOString();
    }

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
        orderFee: CHEF_ORDER_FEE,
        isPaymentRequired: wallet.isPaymentRequired,
        isOrderBlocked: wallet.isOrderBlocked(),
        isInGracePeriod,
        gracePeriodEndsAt,
        gracePeriodDays: GRACE_PERIOD_DAYS,
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