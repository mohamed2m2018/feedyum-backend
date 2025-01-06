const Cart = require('../../models/cart');

const addItemToCart = async (req, res) => {
  const { dishId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const item = cart.items.find(item => item.dish.toString() === dishId);
  if (item) {
    item.quantity += quantity;
  } else {
    cart.items.push({ dish: dishId, quantity });
  }

  await cart.save();
  res.json(cart);
};

module.exports = addItemToCart;
