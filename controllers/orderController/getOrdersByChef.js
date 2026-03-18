const Order = require('../../models/order');
const { isOrderExpired } = require('../../utils/chatLockHelper');

const getOrdersByChef = async (req, res) => {
  try {
    const { chefId } = req.params;

    // Validate chef ID
    if (!chefId) {
      return res.status(400).json({
        message: 'Chef ID is required'
      });
    }

    // Get orders for the chef with populated data and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ chef: chefId })
      .populate('user', 'fullName username avatar type phone')
      .populate({
        path: 'items.dish',
        select: 'name price image description'
      })
      .sort({ created_at: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // Redact phone numbers for expired orders
    orders.forEach(order => {
      if (isOrderExpired(order)) {
        if (order.user && order.user.phone) {
          order.user.phone = null;
        }
      }
    });

    const totalOrders = await Order.countDocuments({ chef: chefId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders: orders,
      totalPages: totalPages,
      currentPage: page,
      totalOrders: totalOrders,
      message: 'Chef orders fetched successfully'
    });

  } catch (error) {
    console.error('Get orders by chef error:', error);
    res.status(500).json({
      message: 'Failed to fetch chef orders',
      error: error.message
    });
  }
};

module.exports = getOrdersByChef; 