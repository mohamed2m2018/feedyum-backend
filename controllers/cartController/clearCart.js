const Cart = require('../../models/cart');

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Clear all items from the cart
    cart.items = [];
    await cart.save();

    res.json({ 
      items: [],
      totalItems: 0,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      message: 'Failed to clear cart', 
      error: error.message 
    });
  }
};

module.exports = clearCart; 