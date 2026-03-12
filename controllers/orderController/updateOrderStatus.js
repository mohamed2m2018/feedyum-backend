const Order = require('../../models/order');
const User = require('../../models/user');
const ChefWallet = require('../../models/chefWallet');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const updateOrderStatus = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { status, estimatedTime, notes, deliveryFee } = req.body;
    const chefId = req.user._id;

    // Validate status
    const validStatuses = ['pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
      });
    }

    // Find the order and verify chef ownership
    const order = await Order.findById(orderId)
      .populate('user', 'fullName username avatar')
      .populate('chef', 'fullName username avatar');

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    if (order.chef._id.toString() !== chefId.toString()) {
      return res.status(403).json({
        message: 'You are not authorized to update this order'
      });
    }

    // Prevent backwards status changes (except for cancellation)
    const statusOrder = ['pending', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const newStatusIndex = statusOrder.indexOf(status);

    if (status !== 'cancelled' && newStatusIndex < currentStatusIndex) {
      return res.status(400).json({
        message: 'Cannot move order backwards in status'
      });
    }

    // When chef accepts the order:
    // - If requireCustomerConfirmation is enabled → redirect to 'awaiting_confirmation'
    // - If disabled → go straight to 'confirmed'
    let actualStatus = status;
    if (status === 'confirmed' && order.status === 'pending') {
      const chef = await User.findById(chefId).select('chefSettings').lean();
      const requireConfirmation = chef?.chefSettings?.requireCustomerConfirmation !== false;
      actualStatus = requireConfirmation ? 'awaiting_confirmation' : 'confirmed';
    }

    // Track if delivery fee was overridden by the chef
    let deliveryFeeOverridden = false;
    const previousDeliveryFee = order.deliveryFee;

    // Update delivery fee if chef overrides it
    if (deliveryFee !== undefined) {
      const parsedFee = Number(deliveryFee);
      if (parsedFee !== order.deliveryFee) {
        deliveryFeeOverridden = true;
      }
      order.deliveryFee = parsedFee;
      // Recalculate totalPrice: subtotal + deliveryFee (no service fee)
      const subtotal = order.subtotal || 0;
      const discountAmount = order.promocode?.discountAmount || 0;
      order.totalPrice = subtotal + parsedFee - discountAmount;
    }

    // Update order status
    const previousStatus = order.status;
    order.status = actualStatus;

    if (estimatedTime) {
      order.estimatedDeliveryTime = estimatedTime;
    }

    if (notes) {
      order.statusNotes = notes;
    }

    order.lastUpdated = new Date();

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: previousStatus,
      changedTo: actualStatus,
      timestamp: new Date(),
      notes: notes || ''
    });

    await order.save();

    // NOTE: Wallet deduction is now handled in confirmOrderByUser.js
    // when the customer confirms the order

    // Refund service fee if chef cancels a confirmed/preparing order
    if (actualStatus === 'cancelled' && ['confirmed', 'preparing'].includes(previousStatus)) {
      try {
        const wallet = await ChefWallet.findOne({ chef: order.chef._id });
        if (wallet) {
          await wallet.refundServiceFee(order._id, order.subtotal);
          console.log(`[WALLET] Refunded service fee for chef-cancelled order ${order._id}`);
        }
      } catch (walletError) {
        console.error('[WALLET] Failed to refund service fee on chef cancellation:', walletError);
      }
    }

    // Send notification to customer about status change
    try {
      const notificationData = {
        userId: order.user._id.toString(),
        orderId: order._id.toString(),
        status: actualStatus,
        chefName: order.chef.fullName,
        orderDetails: {
          total: order.totalPrice.toFixed(2),
          itemCount: order.items.length,
          notes: notes,
          deliveryFee: order.deliveryFee,
          deliveryFeeOverridden,
          previousDeliveryFee: deliveryFeeOverridden ? previousDeliveryFee : undefined,
        },
        estimatedTime: estimatedTime
      };

      await EnhancedNotificationService.sendOrderStatusNotification(notificationData);

      console.log(`Order status notification sent for order ${orderId}: ${actualStatus}`);
    } catch (notificationError) {
      console.error('Failed to send order status notification:', notificationError);
    }

    // Emit socket event to notify customer and chef dashboard
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        // Notify chef dashboard
        io.to(chefId.toString()).emit('chefDashboardUpdate', {
          type: 'orderStatusUpdate',
          orderId: order._id.toString(),
          status: actualStatus,
          previousStatus: previousStatus
        });

        // Notify customer about awaiting confirmation (with delivery fee info)
        if (actualStatus === 'awaiting_confirmation') {
          io.to(order.user._id.toString()).emit('orderUpdate', {
            type: 'awaiting_confirmation',
            orderId: order._id.toString(),
            status: actualStatus,
            deliveryFee: order.deliveryFee,
            deliveryFeeOverridden,
            previousDeliveryFee: deliveryFeeOverridden ? previousDeliveryFee : undefined,
            totalPrice: order.totalPrice,
            chefName: order.chef.fullName,
          });
        }

        console.log(`[SOCKET] Emitted orderStatusUpdate for order ${orderId}: ${actualStatus}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit update:', socketError.message);
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        deliveryFee: order.deliveryFee,
        totalPrice: order.totalPrice,
        deliveryFeeOverridden,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        statusNotes: order.statusNotes,
        lastUpdated: order.lastUpdated,
        statusHistory: order.statusHistory
      },
      message: `Order status updated to ${actualStatus}`
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

module.exports = updateOrderStatus;

