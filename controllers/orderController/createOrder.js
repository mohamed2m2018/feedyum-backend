const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');

const createOrder = async (req, res) => {
  try {
    const { chefId, items, deliveryAddress, notes } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!chefId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Chef ID and items are required'
      });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({
        message: 'Delivery address with street and city is required'
      });
    }

    // Verify chef exists
    const chef = await User.findById(chefId).select('fullName username type');
    if (!chef || chef.type !== 'chef') {
      return res.status(404).json({
        message: 'Chef not found'
      });
    }

    // Verify all dishes exist and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.dish || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: 'Each item must have a valid dish ID and quantity'
        });
      }

      const dish = await Dish.findById(item.dish).select('name price');
      if (!dish) {
        return res.status(404).json({
          message: `Dish with ID ${item.dish} not found`
        });
      }

      const itemTotal = dish.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        dish: item.dish,
        quantity: item.quantity,
        price: dish.price,
        total: itemTotal
      });
    }

    // Calculate fees
    const serviceFeePctg = 0.02; // 2%
    const serviceFee = totalAmount * serviceFeePctg;
    const deliveryFee = 0; // Will be set by chef later
    const finalTotal = totalAmount + serviceFee + deliveryFee;

    // Create the order
    const order = new Order({
      user: userId,
      chef: chefId,
      items: validatedItems,
      subtotal: totalAmount,
      totalPrice: finalTotal,
      serviceFee,
      deliveryFee,
      deliveryAddress,
      specialInstructions: notes || '',
      status: 'pending',
      created_at: new Date()
    });

    await order.save();

    // Populate order data for response
    await order.populate('user', 'fullName username avatar');
    await order.populate('chef', 'fullName username avatar');
    await order.populate('items.dish', 'name price image description');

    res.status(201).json({
      success: true,
      order,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Failed to create order',
      error: error.message
    });
  }
};

module.exports = createOrder; 