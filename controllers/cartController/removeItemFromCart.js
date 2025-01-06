const Cart = require('../../models/cart');

const removeItemFromCart = async (req, res) => {
  const {  dishId } = req.body;
  let cart = await Cart.findOne({ user: req.user._id  });

  if (cart) {
    cart.items = cart.items.filter(item => item.dish.toString() !== dishId);
    await cart.save();
    res.json(cart);
  } else {
    res.status(404).json({ message: 'Cart not found' });
  }
};

module.exports = removeItemFromCart;
