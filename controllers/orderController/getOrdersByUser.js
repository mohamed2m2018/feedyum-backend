const Order = require('../../models/order');

const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required'
      });
    }

    // Get orders for the user with populated data and pagination
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

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders: orders,
      totalPages: totalPages,
      currentPage: page,
      totalOrders: totalOrders,
      message: 'Orders fetched successfully'
    });

  } catch (error) {
    console.error('Get orders by user error:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

module.exports = getOrdersByUser;
