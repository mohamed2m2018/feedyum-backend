const Order = require('../../models/order');
const ChefWallet = require('../../models/chefWallet');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const Message = require('../../models/message');

const cancelOrderByUser = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    // Find the order and verify user ownership
    const order = await Order.findById(orderId)
      .populate('user', 'fullName username avatar')
      .populate('chef', 'fullName username avatar');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify that the order belongs to the user
    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this order'
      });
    }

    // Only allow cancellation when status is 'pending', 'awaiting_confirmation', or 'confirmed' (before preparing)
    if (!['pending', 'awaiting_confirmation', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order. Order can only be cancelled before it starts preparing. Current status: '${order.status}'`
      });
    }

    // Update order status to cancelled
    const previousStatus = order.status;
    order.status = 'cancelled';
    order.cancelledBy = 'user';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.lastUpdated = new Date();

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: previousStatus,
      changedTo: 'cancelled',
      timestamp: new Date(),
      notes: reason || 'Cancelled by customer'
    });

    await order.save();

    // Refund service fee to chef's wallet (only if order was confirmed, since that's when fee is charged)
    const wasConfirmed = previousStatus === 'confirmed';
    if (wasConfirmed) {
      try {
        const wallet = await ChefWallet.findOne({ chef: order.chef._id });

        if (wallet) {
          await wallet.refundServiceFee(order._id);
          console.log(`[WALLET] Refunded service fee for cancelled order ${order._id} to chef ${order.chef._id}`);
        } else {
          console.warn(`[WALLET] No wallet found for chef ${order.chef._id}, skipping refund`);
        }
      } catch (walletError) {
        console.error('[WALLET] Failed to process refund:', walletError);
        // Log but don't fail the cancellation
      }
    }

    // Create cancellation message in chat
    try {
      const refundMessage = wasConfirmed ? '\n\nThe service fee has been refunded to your wallet.' : '';
      const cancellationMessage = new Message({
        sender: userId,
        receiver: order.chef._id,
        content: `❌ Order Cancelled

Order #${order._id.toString().slice(-6)} has been cancelled by the customer.
${reason ? `\n📝 Reason: ${reason}` : ''}${refundMessage}`,
        order: order._id,
        timestamp: new Date()
      });

      await cancellationMessage.save();
    } catch (messageError) {
      console.error('Failed to create cancellation message:', messageError);
    }

    // Send notification to chef about order cancellation
    try {
      const notificationMessage = wasConfirmed
        ? `Order #${order._id.toString().slice(-6)} has been cancelled by ${order.user.fullName}. Service fee has been refunded.`
        : `Order #${order._id.toString().slice(-6)} has been cancelled by ${order.user.fullName}.`;

      await EnhancedNotificationService.sendNotification({
        userIds: [order.chef._id.toString()],
        title: 'Order Cancelled',
        message: notificationMessage,
        type: 'order_cancelled',
        targetId: order._id.toString(),
        additionalData: {
          orderId: order._id.toString(),
          reason: reason || 'Cancelled by customer',
          refunded: wasConfirmed
        }
      });

      console.log(`Order cancellation notification sent to chef for order ${orderId}`);
    } catch (notificationError) {
      console.error('Failed to send cancellation notification:', notificationError);
    }

    // Emit socket event to notify chef about the cancellation
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(order.chef._id.toString()).emit('chefDashboardUpdate', {
          type: 'orderCancelled',
          orderId: order._id.toString(),
          status: 'cancelled',
          previousStatus: previousStatus,
          cancelledBy: 'user',
          refunded: wasConfirmed
        });
        console.log(`[SOCKET] Emitted orderCancelled to chef: ${order.chef._id}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit orderCancelled:', socketError.message);
    }

    const responseMessage = wasConfirmed
      ? 'Order cancelled successfully. Service fee has been refunded to the chef.'
      : 'Order cancelled successfully.';

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        cancelledBy: order.cancelledBy,
        cancellationReason: order.cancellationReason,
        lastUpdated: order.lastUpdated,
        statusHistory: order.statusHistory
      },
      message: responseMessage
    });

  } catch (error) {
    console.error('Cancel order by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

module.exports = cancelOrderByUser;

