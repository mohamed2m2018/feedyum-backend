const AmbassadorWallet = require('../../models/ambassadorWallet');

const getWalletInfo = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find or create wallet for user
    let wallet = await AmbassadorWallet.findOne({ user: userId });

    if (!wallet) {
      wallet = new AmbassadorWallet({
        user: userId,
        balance: 0,
        pendingBalance: 0,
        lifetimeEarnings: 0,
        transactions: [],
      });
      await wallet.save();
    }

    const ambassadorLevel = wallet.getAmbassadorLevel();

    const recentTransactions = wallet.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      message: 'Wallet info retrieved successfully',
      data: {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        ambassadorLevel,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get ambassador wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet information',
    });
  }
};

module.exports = getWalletInfo;
