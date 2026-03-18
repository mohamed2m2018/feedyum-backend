const Order = require('../../models/order');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

/**
 * Confirm deposit received by chef
 * @route PUT /api/orders/:id/confirm-deposit
 */
const confirmDepositReceived = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const chefId = req.user._id;

    const order = await Order.findById(orderId)
      .populate('user', 'fullName username avatar')
      .populate('chef', 'fullName username avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the order's chef can confirm deposit
    if (order.chef._id.toString() !== chefId.toString()) {
      return res.status(403).json({
        message: 'You are not authorized to confirm deposit for this order',
      });
    }

    // Deposit must be required on this order
    if (!order.depositRequired) {
      return res.status(400).json({
        message: 'This order does not require a deposit',
        messageAr: 'هذا الطلب لا يتطلب عربون',
      });
    }

    // Prevent double-confirmation
    if (order.depositConfirmedByChef) {
      return res.status(400).json({
        message: 'Deposit already confirmed',
        messageAr: 'تم تأكيد العربون مسبقاً',
      });
    }

    // Mark deposit as confirmed
    order.depositConfirmedByChef = true;
    order.depositConfirmedAt = new Date();
    order.lastUpdated = new Date();

    await order.save();

    // Notify customer
    try {
      await EnhancedNotificationService.sendChefDashboardNotification({
        chefId: order.user._id.toString(),
        title: { en: '✅ Deposit Confirmed!', ar: '✅ تم تأكيد العربون!' },
        message: {
          en: `${order.chef.fullName} confirmed receiving your deposit for order #${order._id.toString().slice(-6)}`,
          ar: `${order.chef.fullName} أكد استلام العربون لطلبك #${order._id.toString().slice(-6)}`,
        },
        action: 'deposit_confirmed',
        additionalData: {
          orderId: order._id.toString(),
        },
      });
    } catch (notificationError) {
      console.error('Failed to send deposit confirmation notification:', notificationError);
    }

    // Emit socket event
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        io.to(order.user._id.toString()).emit('orderUpdate', {
          type: 'depositConfirmed',
          orderId: order._id.toString(),
          depositConfirmedByChef: true,
          depositConfirmedAt: order.depositConfirmedAt,
        });

        io.to(chefId.toString()).emit('chefDashboardUpdate', {
          type: 'depositConfirmed',
          orderId: order._id.toString(),
        });

        console.log(`[SOCKET] Deposit confirmed for order ${orderId}`);
      }
    } catch (socketError) {
      console.error('[SOCKET] Failed to emit deposit confirmation:', socketError.message);
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        depositConfirmedByChef: order.depositConfirmedByChef,
        depositConfirmedAt: order.depositConfirmedAt,
        lastUpdated: order.lastUpdated,
      },
      message: 'Deposit confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({
      message: 'Failed to confirm deposit',
      error: error.message,
    });
  }
};

module.exports = confirmDepositReceived;
