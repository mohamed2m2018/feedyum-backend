const cron = require('node-cron');
const Order = require('../models/order');
const EnhancedNotificationService = require('../services/enhancedNotificationService');

// Orders expire after 30 minutes in awaiting_confirmation
const EXPIRY_MINUTES = 30;
const EXPIRY_MS = EXPIRY_MINUTES * 60 * 1000;

/**
 * Cron job: Expire orders stuck in 'awaiting_confirmation' for > 30 minutes
 * Runs every 5 minutes
 */
function startOrderExpiry() {
    cron.schedule('*/5 * * * *', async () => {
        const now = new Date();
        const expiryThreshold = new Date(now.getTime() - EXPIRY_MS);

        try {
            // Find all orders stuck in awaiting_confirmation past the threshold
            const expiredOrders = await Order.find({
                status: 'awaiting_confirmation',
                lastUpdated: { $lt: expiryThreshold },
            })
                .populate('user', 'fullName username')
                .populate('chef', 'fullName username');

            if (expiredOrders.length === 0) return;

            console.log(`[CRON] Found ${expiredOrders.length} expired awaiting_confirmation orders`);

            for (const order of expiredOrders) {
                try {
                    const previousStatus = order.status;
                    order.status = 'expired';
                    order.lastUpdated = now;

                    if (!order.statusHistory) {
                        order.statusHistory = [];
                    }
                    order.statusHistory.push({
                        status: previousStatus,
                        changedTo: 'expired',
                        timestamp: now,
                        notes: `Auto-expired after ${EXPIRY_MINUTES} minutes without confirmation`,
                    });

                    await order.save();

                    // Notify user that order expired
                    try {
                        await EnhancedNotificationService.sendOrderStatusNotification({
                            userId: order.user._id.toString(),
                            orderId: order._id.toString(),
                            status: 'expired',
                            chefName: order.chef?.fullName || 'Kitchen',
                            orderDetails: {
                                total: order.totalPrice?.toFixed(2) || '0.00',
                                itemCount: order.items?.length || 0,
                            },
                        });
                    } catch (notifErr) {
                        console.error(`[CRON] Failed to notify user about expired order ${order._id}:`, notifErr.message);
                    }

                    // Notify chef that order expired
                    try {
                        await EnhancedNotificationService.sendNotification({
                            userIds: [order.chef._id.toString()],
                            title: 'Order Expired',
                            message: `Order #${order._id.toString().slice(-6)} expired — customer did not confirm within ${EXPIRY_MINUTES} minutes`,
                            type: 'order_expired',
                            targetId: order._id.toString(),
                        });
                    } catch (notifErr) {
                        console.error(`[CRON] Failed to notify chef about expired order ${order._id}:`, notifErr.message);
                    }

                    console.log(`[CRON] Order ${order._id} expired (was awaiting_confirmation since ${order.lastUpdated})`);
                } catch (orderErr) {
                    console.error(`[CRON] Failed to expire order ${order._id}:`, orderErr.message);
                }
            }
        } catch (err) {
            console.error('[CRON] Order expiry job failed:', err.message);
        }
    });

    console.log(`[CRON] Order expiry scheduled (every 5 min, ${EXPIRY_MINUTES}min threshold)`);
}

module.exports = { startOrderExpiry, EXPIRY_MINUTES };
