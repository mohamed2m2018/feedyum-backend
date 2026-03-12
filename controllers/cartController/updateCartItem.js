const Cart = require('../../models/cart');

const updateCartItem = async (req, res) => {
  try {
    const { dishId, quantity, cartItemKey } = req.body;

    // Identify item by cartItemKey (preferred) or dishId (backward compat)
    const itemIdentifier = cartItemKey || dishId;

    if (!itemIdentifier || quantity === undefined) {
      return res.status(400).json({ message: 'Item identifier (cartItemKey or dishId) and quantity are required' });
    }

    if (quantity < 0 || quantity > 99) {
      return res.status(400).json({ message: 'Quantity must be between 0 and 99' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find item by cartItemKey first, fall back to dishId
    const itemIndex = cart.items.findIndex(item => {
      if (cartItemKey) {
        return (item.cartItemKey || item.dish.toString()) === cartItemKey;
      }
      return item.dish.toString() === dishId;
    });

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: 'items.dish',
      populate: {
        path: 'menu',
        populate: {
          path: 'chef',
          select: 'fullName username _id'
        }
      }
    });

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      ...cart.toObject(),
      totalItems,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      message: 'Failed to update cart',
      error: error.message
    });
  }
};

module.exports = updateCartItem;