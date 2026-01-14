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
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
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
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const newStatusIndex = statusOrder.indexOf(status);

    if (status !== 'cancelled' && newStatusIndex < currentStatusIndex) {
      return res.status(400).json({
        message: 'Cannot move order backwards in status'
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;

    if (estimatedTime) {
      order.estimatedDeliveryTime = estimatedTime;
    }

    if (notes) {
      order.statusNotes = notes;
    }

    if (deliveryFee !== undefined) {
      order.deliveryFee = deliveryFee;
    }

    order.lastUpdated = new Date();

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    order.statusHistory.push({
      status: previousStatus,
      changedTo: status,
      timestamp: new Date(),
      notes: notes || ''
    });

    await order.save();

    // Handle commission deduction when order is confirmed
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      try {
        let wallet = await ChefWallet.findOne({ chef: chefId });

        // If wallet doesn't exist, create it with initial balance
        if (!wallet) {
          wallet = new ChefWallet({
            chef: chefId,
            balance: 500, // Initial balance from platform
            transactions: [{
              type: 'initial_bonus',
              amount: 500,
              description: 'Welcome bonus from platform',
              timestamp: new Date()
            }]
          });
        }

        // Deduct 5% service fee
        // Note: addServiceFee handles the saving of the wallet
        await wallet.addServiceFee(order._id, order.totalPrice);
        console.log(`[WALLET] Deducted service fee for order ${order._id} from chef ${chefId}`);

      } catch (walletError) {
        console.error('[WALLET] Failed to process service fee:', walletError);
        // We log but don't fail the order update to avoid blocking operations
        // ideally this should be a transaction or have a retry mechanism
      }
    }

    // Send notification to customer about status change
    try {
      await EnhancedNotificationService.sendOrderStatusNotification({
        userId: order.user._id.toString(),
        orderId: order._id.toString(),
        status: status,
        chefName: order.chef.fullName,
        orderDetails: {
          total: order.totalPrice.toFixed(2),
          itemCount: order.items.length,
          notes: notes
        },
        estimatedTime: estimatedTime
      });

      console.log(`Order status notification sent for order ${orderId}: ${status}`);
    } catch (notificationError) {
      console.error('Failed to send order status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    // Emit socket event to notify chef dashboard about the order update
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(chefId.toString()).emit('chefDashboardUpdate', {
          type: 'orderStatusUpdate',
          orderId: order._id.toString(),
          status: status,
          previousStatus: previousStatus
        });
        console.log(`[SOCKET] Emitted chefDashboardUpdate (orderStatusUpdate) to chef: ${chefId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit chefDashboardUpdate:', socketError.message);
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        statusNotes: order.statusNotes,
        lastUpdated: order.lastUpdated,
        statusHistory: order.statusHistory
      },
      message: `Order status updated to ${status}`
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
