const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const PromoCode = require('../../models/promocode');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { validateDeliveryDistance } = require('../../utils/deliveryValidation');
const { calculateDeliveryFee } = require('../../config/feeConfig');

const createOrder = async (req, res) => {
  try {
    const { chefId, items, deliveryAddress, notes, promocode, paymentMethod } = req.body;
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

    // Validate payment method
    const validPaymentMethods = ['cod', 'online'];
    const selectedPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'cod';

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
    let validationResult = null;
    if (deliveryAddress) {
      validationResult = await validateDeliveryDistance(chefId, deliveryAddress);

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

    // Calculate delivery fee from nearest branch tiers
    let deliveryFee = 0;
    if (validationResult && validationResult.nearestBranch) {
      // Use the full branch document to access deliveryTiers
      const ChefBranch = require('../../models/chefBranch');
      const fullBranch = await ChefBranch.findById(validationResult.nearestBranch.branchId);
      if (fullBranch && fullBranch.deliveryTiers && fullBranch.deliveryTiers.length > 0) {
        deliveryFee = calculateDeliveryFee(validationResult.nearestDistance, fullBranch.deliveryTiers, fullBranch.deliveryFee);
      } else if (fullBranch) {
        deliveryFee = fullBranch.deliveryFee || 0;
      }
    }
    const serviceFee = 0; // No customer service fee — platform charges chef commission instead

    // Apply promocode discount if provided
    let discountAmount = 0;
    let appliedPromocode = null;
    if (promocode && promocode.code && promocode.discountAmount > 0) {
      discountAmount = Math.min(promocode.discountAmount, totalAmount); // Don't discount more than subtotal
      appliedPromocode = {
        code: promocode.code,
        discountAmount: Number(discountAmount.toFixed(2)),
        discountType: promocode.discountType || 'fixed',
      };
    }

    const finalTotal = totalAmount + deliveryFee - discountAmount;

    // Create the order
    const order = new Order({
      user: userId,
      chef: chefId,
      items: validatedItems,
      subtotal: Number(totalAmount.toFixed(2)),
      totalPrice: Number(finalTotal.toFixed(2)),
      serviceFee: 0,
      deliveryFee: Number(deliveryFee.toFixed(2)),
      ...(appliedPromocode && { promocode: appliedPromocode }),
      deliveryAddress,
      specialInstructions: notes || '',
      paymentMethod: selectedPaymentMethod,
      status: 'pending',
      created_at: new Date(),
      lastUpdated: new Date(), // For unseen order badge tracking
    });

    await order.save();

    // Increment promocode usage count
    if (appliedPromocode) {
      try {
        await PromoCode.findOneAndUpdate(
          { code: appliedPromocode.code },
          { $inc: { usedCount: 1 } }
        );
      } catch (promoErr) {
        console.error('Failed to increment promocode usage:', promoErr);
      }
    }

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