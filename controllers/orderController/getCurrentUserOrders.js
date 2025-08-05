const Order = require('../../models/order');

const getCurrentUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user

    // Get orders for the current user with populated data and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .populate('chef', 'fullName username avatar type')
      .populate({
        path: 'items.dish',
        select: 'name price image description'
      })
      .sort({ created_at: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      orders: orders,
      message: 'Orders fetched successfully'
    });

  } catch (error) {
    console.error('Get current user orders error:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

module.exports = getCurrentUserOrders;