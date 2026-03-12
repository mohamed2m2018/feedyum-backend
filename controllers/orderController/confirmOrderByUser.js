const Order = require('../../models/order');
const ChefWallet = require('../../models/chefWallet');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { calculateCommission, CHEF_COMMISSION_PERCENTAGE } = require('../../config/feeConfig');

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
                    balance: 500, // Initial balance from platform
                    transactions: [{
                        type: 'initial_bonus',
                        amount: 500,
                        description: 'Welcome bonus from platform',
                        timestamp: new Date(),
                    }],
                });
            }

            // Use configurable commission percentage (on subtotal after discount)
            const discountAmount = order.promocode?.discountAmount || 0;
            const commissionAmount = calculateCommission(order.subtotal, discountAmount);
            await wallet.addServiceFee(order._id, order.subtotal - discountAmount);
            console.log(`[WALLET] Deducted ${(CHEF_COMMISSION_PERCENTAGE * 100)}% commission (${commissionAmount} EGP) on ${order.subtotal - discountAmount} EGP (subtotal ${order.subtotal} - discount ${discountAmount}) for order ${order._id}`);
        } catch (walletError) {
            console.error(`[WALLET] CRITICAL: Failed to collect ${(CHEF_COMMISSION_PERCENTAGE * 100)}% commission for order ${order._id}, chef ${chefId}:`, walletError.message);
            // Don't fail the confirmation if wallet deduction fails
            // The fee can be collected manually or via a reconciliation job
        }

        // Notify chef that user confirmed
        try {
            await EnhancedNotificationService.sendOrderStatusNotification({
                userId: order.chef._id.toString(),
                orderId: order._id.toString(),
                status: 'confirmed',
                chefName: order.user.fullName,
                orderDetails: {
                    total: order.totalPrice.toFixed(2),
                    itemCount: order.items.length,
                    notes: 'Customer confirmed the order',
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
