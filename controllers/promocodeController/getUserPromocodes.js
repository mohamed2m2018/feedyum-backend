const PromoCode = require('../../models/promocode');

const getUserPromocodes = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all promocodes created by the current user
    const promocodes = await PromoCode.find({ createdBy: userId })
      .sort({ created_at: -1 })
      .lean();

    res.json({
      success: true,
      promocodes,
      count: promocodes.length
    });

  } catch (error) {
    console.error('Get user promocodes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get promocodes',
      error: error.message
    });
  }
};

module.exports = getUserPromocodes;