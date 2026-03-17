const Order = require('../../models/order');
const User = require('../../models/user');
const Dish = require('../../models/dish');
const ChefBranch = require('../../models/chefBranch');
const PromoCode = require('../../models/promocode');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { validateDeliveryDistance } = require('../../utils/deliveryValidation');
const { calculateDeliveryFee, calculateServiceFee, isServiceFeeWaiverCode } = require('../../config/feeConfig');

const createOrder = async (req, res) => {
  try {
    const { chefId, items, deliveryAddress, notes, promocode, paymentMethod, scheduledFor, scheduledSlotLabel } = req.body;
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
    const chef = await User.findById(chefId).select('fullName username type avatar chefSettings');
    if (!chef || chef.type !== 'chef') {
      return res.status(404).json({
        message: 'Chef not found'
      });
    }

    // Check if chef's wallet requires payment (grace period expired)
    const ChefWallet = require('../../models/chefWallet');
    const chefWallet = await ChefWallet.findOne({ chef: chefId });
    if (chefWallet && chefWallet.isOrderBlocked()) {
      return res.status(400).json({
        message: 'This restaurant is temporarily unavailable',
        messageAr: 'هذا المطعم غير متاح مؤقتاً',
        errorCode: 'CHEF_PAYMENT_REQUIRED',
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

      const dish = await Dish.findById(item.dish).select('name price optionGroups');
      if (!dish) {
        return res.status(404).json({
          message: `Dish with ID ${item.dish} not found`
        });
      }

      // Server-side price validation: recalculate unitPrice from dish + selected options
      let totalAdjustment = 0;
      let validatedOptions = [];

      if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
        for (const selection of item.selectedOptions) {
          // Find the matching option group on the dish
          const group = (dish.optionGroups || []).find(g => g.name === selection.groupName);
          if (!group) continue; // Skip unknown groups (non-blocking)

          let groupAdjustment = 0;
          const validOptionNames = [];

          for (const optName of (selection.optionNames || [])) {
            const opt = group.options.find(o => o.name === optName);
            if (opt) {
              groupAdjustment += (opt.priceAdjustment || 0);
              validOptionNames.push(optName);
            }
          }

          if (validOptionNames.length > 0) {
            totalAdjustment += groupAdjustment;
            validatedOptions.push({
              groupName: selection.groupName,
              optionNames: validOptionNames,
              totalAdjustment: groupAdjustment,
            });
          }
        }
      }

      const unitPrice = dish.price + totalAdjustment;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        dish: item.dish,
        quantity: item.quantity,
        selectedOptions: validatedOptions,
        unitPrice,
        price: unitPrice, // backward compat
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
          messageAr: validationResult.errorMessageAr || '',
          error: validationResult.error,
          errorCode: validationResult.error === 'excluded_area' ? 'EXCLUDED_AREA' : 'DELIVERY_DISTANCE',
          chefId,
          nearestDistance: validationResult.nearestDistance,
          maxDistance: validationResult.maxDistance,
          nearestBranch: validationResult.nearestBranch?.branchName,
          excludedAreaName: validationResult.excludedAreaName || null,
        });
      }
    }

    // ─── Scheduling vs Instant Logic ──────────────────────────────────────────
    let isScheduled = false;
    let scheduledDate = null;

    if (scheduledFor) {
      // 1. Nearest branch must allow scheduling
      const servingBranch = validationResult?.nearestBranch;
      const fullServingBranch = servingBranch?.branchId
        ? await ChefBranch.findById(servingBranch.branchId).select('allowScheduledOrders orderMode').lean()
        : null;

      const branchOrderMode = fullServingBranch?.orderMode || (fullServingBranch?.allowScheduledOrders ? 'both' : 'asap');
      if (branchOrderMode === 'asap') {
        return res.status(400).json({
          message: 'This branch does not accept scheduled orders',
          messageAr: 'هذا الفرع لا يقبل الطلبات المجدولة',
          errorCode: 'SCHEDULING_NOT_ALLOWED',
        });
      }

      // 2. Validate time bounds
      scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid scheduled date',
          messageAr: 'تاريخ غير صالح',
        });
      }

      const now = Date.now();
      const MIN_ADVANCE_MS = 30 * 60 * 1000; // 30 min
      const MAX_ADVANCE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (scheduledDate.getTime() < now + MIN_ADVANCE_MS) {
        return res.status(400).json({
          message: 'Scheduled time must be at least 30 minutes from now',
          messageAr: 'يجب أن يكون الموعد بعد 30 دقيقة على الأقل',
          errorCode: 'TOO_SOON',
        });
      }

      if (scheduledDate.getTime() > now + MAX_ADVANCE_MS) {
        return res.status(400).json({
          message: 'Cannot schedule more than 7 days ahead',
          messageAr: 'لا يمكن الجدولة لأكثر من 7 أيام',
          errorCode: 'TOO_FAR',
        });
      }

      // 3. Validate slot is within chef's operating hours
      const { validateScheduledSlot } = require('./getAvailableSlots');
      const isValidSlot = await validateScheduledSlot(chefId, scheduledDate);
      if (!isValidSlot) {
        return res.status(400).json({
          message: 'The selected time is outside the kitchen\'s working hours',
          messageAr: 'الوقت المختار خارج ساعات عمل المطبخ',
          errorCode: 'OUTSIDE_HOURS',
        });
      }

      isScheduled = true;
      // Skip isChefOpen() — chef might be closed NOW but open at scheduledFor
    } else {
      // INSTANT order: chef must be open right now
      const { isChefOpen } = require('../../utils/branchAvailability');
      const openStatus = await isChefOpen(chefId);
      if (!openStatus.isOpen) {
        return res.status(400).json({
          message: 'This restaurant is currently closed',
          messageAr: 'هذا المطعم مغلق حالياً',
          errorCode: 'RESTAURANT_CLOSED',
          nextOpenTime: openStatus.nextOpenTime,
          nextOpenDay: openStatus.nextOpenDay,
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
    let serviceFee = calculateServiceFee(totalAmount);

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

      // Waive service fee if the special waiver code is used
      if (isServiceFeeWaiverCode(promocode.code)) {
        serviceFee = 0;
      }
    }

    const finalTotal = totalAmount + deliveryFee + serviceFee - discountAmount;

    // Create the order
    const order = new Order({
      user: userId,
      chef: chefId,
      items: validatedItems,
      subtotal: Number(totalAmount.toFixed(2)),
      totalPrice: Number(finalTotal.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      ...(appliedPromocode && { promocode: appliedPromocode }),
      deliveryAddress,
      specialInstructions: notes || '',
      paymentMethod: selectedPaymentMethod,
      status: 'pending',
      orderType: isScheduled ? 'scheduled' : 'instant',
      ...(isScheduled && { scheduledFor: scheduledDate, scheduledSlotLabel: scheduledSlotLabel || null }),
      created_at: new Date(),
      lastUpdated: new Date(),
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
      // Notify chef about new order (instant or scheduled — chef needs to prepare)
      await EnhancedNotificationService.sendNewOrderNotification({
        chefId: chef._id.toString(),
        orderId: order._id.toString(),
        customerName: customer.fullName,
        orderTotal: finalTotal.toFixed(2),
        itemCount: validatedItems.length,
        customerAvatar: customer.avatar
      });

      // Customer does NOT get notified here — they just placed the order
      // They will be notified when the chef accepts/rejects

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
        console.log(`[SOCKET] Emitted chefDashboardUpdate (newOrder) to chef: ${chefId}${isScheduled ? ` [scheduled for ${scheduledDate.toISOString()}]` : ''}`);
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