const AmbassadorWallet = require('../../models/ambassadorWallet');
const MissionParticipation = require('../../models/missionParticipation');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find or create wallet
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

    // Find all active participations for user
    const activeParticipations = await MissionParticipation.find({
      user: userId,
      status: 'active',
    }).populate('mission', 'title type coverImage');

    // Calculate aggregated stats from participations
    let totalOrdersGenerated = 0;
    let totalViews = 0;
    let bestRank = null;

    activeParticipations.forEach((participation) => {
      if (participation.metrics) {
        totalOrdersGenerated += participation.metrics.totalOrdersGenerated || 0;
        totalViews += participation.metrics.totalViews || 0;
      }
      if (participation.rank != null) {
        if (bestRank === null || participation.rank < bestRank) {
          bestRank = participation.rank;
        }
      }
    });

    // Recent earnings: last 5 transactions
    const recentEarnings = wallet.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    const activeMissions = activeParticipations.map((participation) => ({
      ...(participation.mission?.toObject?.() || {}),
      participationId: participation._id,
      rank: participation.rank,
      status: participation.status,
      ordersGenerated: participation.metrics?.totalOrdersGenerated || 0,
      earned: participation.metrics?.totalCommissionEarned || 0,
    }));

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        wallet: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          lifetimeEarnings: wallet.lifetimeEarnings,
          ambassadorLevel: wallet.getAmbassadorLevel(),
        },
        missions: {
          totalActiveMissions: activeParticipations.length,
          activeMissions,
        },
        activeMissions,
        stats: {
          totalActiveMissions: activeParticipations.length,
          totalOrdersGenerated,
          totalViews,
          bestRank,
        },
        recentEarnings,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
    });
  }
};

module.exports = getDashboardStats;
