const Cart = require('../../models/cart');

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.dish',
      populate: {
        path: 'menu',
        populate: {
          path: 'chef',
          select: 'fullName username _id'
        }
      }
    });

    if (!cart) {
      return res.status(200).json({ items: [], totalItems: 0, message: 'Cart is empty' });
    }

    // Calculate total items in cart
    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.status(200).json({ 
      ...cart.toObject(),
      totalItems 
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      message: 'Failed to get cart', 
      error: error.message 
    });
  }
};

module.exports = getCart; 