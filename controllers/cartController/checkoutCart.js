const Cart = require('../../models/cart');
const Order = require('../../models/order');

const checkoutCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate("items.dish");

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const totalPrice = cart.items.reduce((total, item) => total + item.dish.price * item.quantity, 0);

  const order = new Order({
    user: req.user._id,
    items: cart.items,
    totalPrice,
  });

  await order.save();

  // Clear the cart
  await Cart.findOneAndDelete({ user: req.user._id });

  res.json(order);
};

module.exports = checkoutCart;
