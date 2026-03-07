const cron = require('node-cron');
const Order = require('../models/order');
const EnhancedNotificationService = require('../services/enhancedNotificationService');

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Cron job: Sends hourly reminders for stale orders
 * - Users with orders stuck in 'awaiting_confirmation' for > 1 hour
 * - Chefs with orders stuck in 'pending' for > 1 hour
 */
function startStaleOrderReminders() {
    // Run at the top of every hour
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Running stale order reminders...');
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS);

        try {
            // 1. Remind USERS about orders awaiting their confirmation
            const userStaleOrders = await Order.find({
                status: 'awaiting_confirmation',
                lastUpdated: { $lt: oneHourAgo },
                $or: [
                    { lastReminderSentAt: null },
                    { lastReminderSentAt: { $lt: oneHourAgo } },
                ],
            })
                .populate('user', 'fullName username')
                .populate('chef', 'fullName username');

            for (const order of userStaleOrders) {
                try {
                    const chefName = order.chef?.fullName || order.chef?.username || 'Kitchen';
                    await EnhancedNotificationService.sendOrderStatusNotification({
                        userId: order.user._id.toString(),
                        orderId: order._id.toString(),
                        status: 'awaiting_confirmation',
                        chefName,
                        orderDetails: {
                            total: order.totalPrice?.toFixed(2) || '0.00',
                            itemCount: order.items?.length || 0,
                            isReminder: true,
                        },
                    });

                    order.lastReminderSentAt = now;
                    await order.save();
                    console.log(`[CRON] Sent user reminder for order ${order._id}`);
                } catch (err) {
                    console.error(`[CRON] Failed to send user reminder for order ${order._id}:`, err.message);
                }
            }

            // 2. Remind CHEFS about orders they haven't reviewed
            const chefStaleOrders = await Order.find({
                status: 'pending',
                created_at: { $lt: oneHourAgo },
                $or: [
                    { lastReminderSentAt: null },
                    { lastReminderSentAt: { $lt: oneHourAgo } },
                ],
            })
                .populate('user', 'fullName username')
                .populate('chef', 'fullName username');

            for (const order of chefStaleOrders) {
                try {
                    const customerName = order.user?.fullName || order.user?.username || 'Customer';
                    await EnhancedNotificationService.sendChefDashboardNotification({
                        chefId: order.chef._id.toString(),
                        title: 'Order Reminder',
                        message: `You have a pending order from ${customerName} waiting for your review`,
                        action: 'review_order',
                        targetId: order._id.toString(),
                        additionalData: {
                            orderId: order._id.toString(),
                            customerName,
                            isReminder: true,
                        },
                    });

                    order.lastReminderSentAt = now;
                    await order.save();
                    console.log(`[CRON] Sent chef reminder for order ${order._id}`);
                } catch (err) {
                    console.error(`[CRON] Failed to send chef reminder for order ${order._id}:`, err.message);
                }
            }

            const total = userStaleOrders.length + chefStaleOrders.length;
            if (total > 0) {
                console.log(`[CRON] Stale order reminders: ${userStaleOrders.length} user, ${chefStaleOrders.length} chef`);
            } else {
                console.log('[CRON] No stale orders found');
            }
        } catch (err) {
            console.error('[CRON] Stale order reminders failed:', err.message);
        }
    });

    console.log('[CRON] Stale order reminders scheduled (every hour at :00)');
}

module.exports = { startStaleOrderReminders };
