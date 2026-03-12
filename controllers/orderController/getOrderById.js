const Order = require('../../models/order');
const { calculateCommission, CHEF_COMMISSION_PERCENTAGE } = require('../../config/feeConfig');

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName username avatar email phone')
      .populate('chef', 'fullName username avatar email phone')
      .populate('items.dish', 'name price image description');
    
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const orderObj = order.toObject();

    // Add commission info for chef users (not visible to customers)
    const isChef = req.user._id.toString() === order.chef?._id?.toString();
    if (isChef) {
      const discountAmount = order.promocode?.discountAmount || 0;
      const commissionAmount = calculateCommission(order.subtotal, discountAmount);
      const commissionBase = Math.max(0, order.subtotal - discountAmount);

      orderObj.chefCommission = {
        percentage: CHEF_COMMISSION_PERCENTAGE * 100,
        base: commissionBase,
        amount: commissionAmount,
        earnings: Number(((order.totalPrice || 0) - commissionAmount).toFixed(2)),
      };
    }

    res.status(200).json(orderObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getOrderById;
