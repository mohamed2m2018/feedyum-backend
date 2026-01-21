const Order = require('../../models/order');

/**
 * Get count of orders with unseen status changes for the current user.
 * - For customers: orders where lastUpdated > userLastSeenAt
 * - For chefs: orders where lastUpdated > chefLastSeenAt
 * 
 * IMPORTANT: Only counts orders that have an actual lastUpdated date.
 * Orders without lastUpdated are NOT counted as unseen (they're just old orders).
 */
const getUnseenOrderCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.type; // 'user' or 'chef'

        // Only count active orders (not completed/cancelled)
        const baseQuery = {
            status: { $nin: ['delivered', 'cancelled', 'completed'] }
        };

        let unseenCount = 0;

        if (userType === 'chef') {
            // Chef sees their incoming orders
            const orders = await Order.find({
                ...baseQuery,
                chef: userId,
                // Must have a lastUpdated date to be considered "unseen"
                lastUpdated: { $exists: true, $ne: null }
            }).select('lastUpdated chefLastSeenAt').lean();

            // Count orders where chef hasn't seen the latest update
            unseenCount = orders.filter(order => {
                // If chef hasn't seen it at all, it's unseen
                if (!order.chefLastSeenAt) return true;
                // If there's been an update since last seen, it's unseen
                return new Date(order.lastUpdated) > new Date(order.chefLastSeenAt);
            }).length;

        } else {
            // Customer sees their placed orders
            const orders = await Order.find({
                ...baseQuery,
                user: userId,
                // Must have a lastUpdated date to be considered "unseen"
                lastUpdated: { $exists: true, $ne: null }
            }).select('lastUpdated userLastSeenAt').lean();

            // Count orders where user hasn't seen the latest update
            unseenCount = orders.filter(order => {
                // If user hasn't seen it at all, it's unseen
                if (!order.userLastSeenAt) return true;
                // If there's been an update since last seen, it's unseen
                return new Date(order.lastUpdated) > new Date(order.userLastSeenAt);
            }).length;
        }

        console.log(`[getUnseenOrderCount] User ${userId} (${userType}): ${unseenCount} unseen orders`);

        res.json({
            unseenCount,
            message: 'Unseen order count fetched successfully'
        });

    } catch (error) {
        console.error('Get unseen order count error:', error);
        res.status(500).json({
            message: 'Failed to fetch unseen order count',
            error: error.message
        });
    }
};

module.exports = getUnseenOrderCount;
