const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { validateDeliveryDistance } = require('../../utils/deliveryValidation');

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

    // Verify chef exists and get chef details
    const chef = await User.findById(chefId).select('fullName username type avatar');
    if (!chef || chef.type !== 'chef') {
      return res.status(404).json({
        message: 'Chef not found'
      });
    }

    // Get customer details for notifications
    const customer = await User.findById(userId).select('fullName username avatar');
    if (!customer) {
      return res.status(404).json({
        message: 'Customer not found'
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

    // Geographic validation: Distance-based delivery check
    if (deliveryAddress) {
      const validationResult = await validateDeliveryDistance(chefId, deliveryAddress);

      if (!validationResult.canDeliver) {
        return res.status(400).json({
          message: validationResult.errorMessage,
          error: validationResult.error,
          chefId,
          nearestDistance: validationResult.nearestDistance,
          maxDistance: validationResult.maxDistance,
          nearestBranch: validationResult.nearestBranch?.branchName
        });
      }
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
      subtotal: Number(totalAmount.toFixed(2)),
      totalPrice: Number(finalTotal.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      deliveryAddress,
      specialInstructions: notes || '',
      status: 'pending',
      created_at: new Date(),
      lastUpdated: new Date(), // For unseen order badge tracking
    });

    await order.save();

    // Populate order data for response
    await order.populate('user', 'fullName username avatar');
    await order.populate('chef', 'fullName username avatar');
    await order.populate('items.dish', 'name price image description');

    // Send notifications
    try {
      // Notify chef about new order
      await EnhancedNotificationService.sendNewOrderNotification({
        chefId: chef._id.toString(),
        orderId: order._id.toString(),
        customerName: customer.fullName,
        orderTotal: finalTotal.toFixed(2),
        itemCount: validatedItems.length,
        customerAvatar: customer.avatar
      });

      // Notify customer about order status (pending)
      await EnhancedNotificationService.sendOrderStatusNotification({
        userId: customer._id.toString(),
        orderId: order._id.toString(),
        status: 'pending',
        chefName: chef.fullName,
        orderDetails: {
          total: finalTotal.toFixed(2),
          itemCount: validatedItems.length
        }
      });

      console.log('Order notifications sent successfully');
    } catch (notificationError) {
      console.error('Failed to send order notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    // Emit socket event to notify chef about the new order
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(chefId.toString()).emit('chefDashboardUpdate', {
          type: 'newOrder',
          orderId: order._id.toString(),
          order: order
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (newOrder) to chef: ${chefId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

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