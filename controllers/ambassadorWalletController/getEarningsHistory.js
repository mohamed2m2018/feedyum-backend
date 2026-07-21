const AmbassadorWallet = require('../../models/ambassadorWallet');

const getEarningsHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, page = 1, limit = 20, grouped } = req.query;

    const wallet = await AmbassadorWallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found',
      });
    }

    // Filter transactions by type if provided
    let transactions = [...wallet.transactions];

    if (type) {
      const requestedTypes = String(type).split(',').map(value => value.trim()).filter(Boolean);
      transactions = transactions.filter((t) => requestedTypes.includes(t.type));
    }

    // Sort by timestamp descending
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalCount = transactions.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + limitNum);

    // Group by day if requested
    if (grouped === 'true') {
      const groupedByDay = {};

      paginatedTransactions.forEach((transaction) => {
        const date = new Date(transaction.timestamp);
        const dayKey = date.toISOString().split('T')[0];

        if (!groupedByDay[dayKey]) {
          groupedByDay[dayKey] = {
            date: dayKey,
            transactions: [],
            totalAmount: 0,
          };
        }

        groupedByDay[dayKey].transactions.push(transaction);
        groupedByDay[dayKey].totalAmount += transaction.amount;
      });

      const groupedArray = Object.values(groupedByDay).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return res.status(200).json({
        success: true,
        message: 'Earnings history retrieved successfully',
        data: {
          grouped: groupedArray,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Earnings history retrieved successfully',
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get earnings history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings history',
    });
  }
};

module.exports = getEarningsHistory;
