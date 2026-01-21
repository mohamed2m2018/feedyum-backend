const Order = require('../../models/order');

/**
 * Mark an order as "seen" by the current user.
 * Updates userLastSeenAt or chefLastSeenAt based on user type.
 */
const markOrderSeen = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.type;
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify user has access to this order
        const isOwner = order.user.toString() === userId.toString();
        const isChef = order.chef.toString() === userId.toString();

        if (!isOwner && !isChef) {
            return res.status(403).json({ message: 'Not authorized to access this order' });
        }

        // Update the appropriate "last seen" field
        const updateField = isChef ? 'chefLastSeenAt' : 'userLastSeenAt';

        await Order.findByIdAndUpdate(orderId, {
            [updateField]: new Date()
        });

        // Emit updated badge counts via socket for real-time UI update
        try {
            const socketModule = require('../../socket');
            const io = socketModule.getIO();
            if (io) {
                const { getBadgeCounts } = socketModule;
                const badgeCounts = await getBadgeCounts(userId.toString());
                io.to(userId.toString()).emit('badgeCountsUpdate', badgeCounts);
                console.log('[markOrderSeen] Emitted badge counts update to user:', userId);
            }
        } catch (socketError) {
            console.warn('[markOrderSeen] Failed to emit socket event:', socketError.message);
        }

        res.json({
            success: true,
            message: 'Order marked as seen'
        });

    } catch (error) {
        console.error('Mark order seen error:', error);
        res.status(500).json({
            message: 'Failed to mark order as seen',
            error: error.message
        });
    }
};

module.exports = markOrderSeen;
