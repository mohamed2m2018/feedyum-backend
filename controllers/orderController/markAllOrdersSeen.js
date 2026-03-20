const Order = require('../../models/order');

/**
 * Mark all unseen orders as "seen" by the current user.
 * Clears the unseen orders badge instantly.
 */
const markAllOrdersSeen = async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.type;

        // Determine which "last seen" field to update
        const updateField = userType === 'chef' ? 'chefLastSeenAt' : 'userLastSeenAt';
        
        // Find orders where user is involved
        const query = userType === 'chef'
            ? { chef: userId }
            : { user: userId };

        await Order.updateMany(query, {
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
                console.log('[markAllOrdersSeen] Emitted badge counts update to user:', userId);
            }
        } catch (socketError) {
            console.warn('[markAllOrdersSeen] Failed to emit socket event:', socketError.message);
        }

        res.json({
            success: true,
            message: 'All orders marked as seen'
        });

    } catch (error) {
        console.error('Mark all orders seen error:', error);
        res.status(500).json({
            message: 'Failed to mark all orders as seen',
            error: error.message
        });
    }
};

module.exports = markAllOrdersSeen;
