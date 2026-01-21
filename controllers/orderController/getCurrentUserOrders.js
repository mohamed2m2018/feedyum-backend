const Order = require('../../models/order');
const Message = require('../../models/message');

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

    // Get unread message count for each order
    const ordersWithUnreadCount = await Promise.all(
      orders.map(async (order) => {
        const unreadCount = await Message.countDocuments({
          order: order._id,
          receiver: userId,
          isRead: false,
          isDeleted: { $ne: true }
        });
        return {
          ...order,
          unreadMessageCount: unreadCount
        };
      })
    );

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      orders: ordersWithUnreadCount,
      totalPages: totalPages,
      currentPage: page,
      totalOrders: totalOrders,
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