const Order = require('../../models/order');
const ChefWallet = require('../../models/chefWallet');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { CHEF_ORDER_FEE, INITIAL_WELCOME_CREDIT } = require('../../config/feeConfig');

/**
 * Confirm order by user (after chef accepts and sets awaiting_confirmation)
 * @route PUT /api/orders/:id/confirm
 */
const confirmOrderByUser = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const userId = req.user._id;

        // Find the order
        const order = await Order.findById(orderId)
            .populate('user', 'fullName username avatar')
            .populate('chef', 'fullName username avatar');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the user owns this order
        if (order.user._id.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to confirm this order' });
        }

        // Only allow confirmation from awaiting_confirmation status
        if (order.status !== 'awaiting_confirmation') {
            return res.status(400).json({
                message: 'Order can only be confirmed when it is awaiting your confirmation',
                currentStatus: order.status,
            });
        }

        // Update status to confirmed
        const previousStatus = order.status;
        order.status = 'confirmed';
        order.lastUpdated = new Date();

        if (!order.statusHistory) {
            order.statusHistory = [];
        }
        order.statusHistory.push({
            status: previousStatus,
            changedTo: 'confirmed',
            timestamp: new Date(),
            notes: 'Confirmed by customer',
        });

        await order.save();

        // Deduct chef commission from wallet
        try {
            const chefId = order.chef._id;
            let wallet = await ChefWallet.findOne({ chef: chefId });

            if (!wallet) {
                wallet = new ChefWallet({
                    chef: chefId,
                    balance: INITIAL_WELCOME_CREDIT,
                    transactions: [{
                        type: 'initial_bonus',
                        amount: INITIAL_WELCOME_CREDIT,
                        description: 'Welcome credit from platform',
                        timestamp: new Date(),
                    }],
                });
            }

            // Deduct flat platform order fee
            await wallet.addServiceFee(order._id);
            console.log(`[WALLET] Deducted ${CHEF_ORDER_FEE} EGP platform fee for order ${order._id}`);
        } catch (walletError) {
            console.error(`[WALLET] CRITICAL: Failed to collect ${CHEF_ORDER_FEE} EGP platform fee for order ${order._id}, chef ${chefId}:`, walletError.message);
            // Don't fail the confirmation if wallet deduction fails
            // The fee can be collected manually or via a reconciliation job
        }

        // Notify chef that user confirmed (high-priority alarm like new order)
        try {
            await EnhancedNotificationService.sendChefDashboardNotification({
                chefId: order.chef._id.toString(),
                title: { en: '✅ Order Confirmed!', ar: '✅ تم تأكيد الطلب!' },
                message: {
                    en: `${order.user.fullName} confirmed order #${order._id.toString().slice(-6)}`,
                    ar: `${order.user.fullName} أكّد الطلب #${order._id.toString().slice(-6)}`
                },
                action: 'order_confirmed',
                additionalData: {
                    orderId: order._id.toString(),
                    alarmType: 'orderConfirmed',
                },
            });
        } catch (notificationError) {
            console.error('Failed to send confirmation notification:', notificationError);
        }

        // Emit socket events
        try {
            const socketModule = require('../../socket');
            const io = socketModule.getIO();
            if (io) {
                // Notify chef dashboard
                io.to(order.chef._id.toString()).emit('chefDashboardUpdate', {
                    type: 'orderStatusUpdate',
                    orderId: order._id.toString(),
                    status: 'confirmed',
                    previousStatus: 'awaiting_confirmation',
                });

                // Notify customer (order tracking update)
                io.to(userId.toString()).emit('orderUpdate', {
                    type: 'orderConfirmed',
                    orderId: order._id.toString(),
                    status: 'confirmed',
                });

                console.log(`[SOCKET] Order ${orderId} confirmed by user`);
            }
        } catch (socketError) {
            console.error('[SOCKET] Failed to emit confirmation update:', socketError.message);
        }

        res.json({
            success: true,
            order: {
                _id: order._id,
                status: order.status,
                totalPrice: order.totalPrice,
                deliveryFee: order.deliveryFee,
                lastUpdated: order.lastUpdated,
            },
            message: 'Order confirmed successfully',
        });

    } catch (error) {
        console.error('Confirm order error:', error);
        res.status(500).json({
            message: 'Failed to confirm order',
            error: error.message,
        });
    }
};

module.exports = confirmOrderByUser;
