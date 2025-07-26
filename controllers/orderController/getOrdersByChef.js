const Order = require('../../models/order');

const getOrdersByChef = async (req, res) => {
  try {
    const { chefId } = req.params;

    // Validate chef ID
    if (!chefId) {
      return res.status(400).json({
        message: 'Chef ID is required'
      });
    }

    // Get orders for the chef with populated data
    const orders = await Order.find({ chef: chefId })
      .populate('user', 'fullName username avatar type')
      .populate({
        path: 'items.dish',
        select: 'name price image description'
      })
      .sort({ created_at: -1 }) // Most recent first
      .lean();

    res.json({
      success: true,
      orders: orders,
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