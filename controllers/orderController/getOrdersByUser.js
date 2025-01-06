const Order = require('../../models/order');

const getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id  }).populate('items.dish');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = getOrdersByUser;
