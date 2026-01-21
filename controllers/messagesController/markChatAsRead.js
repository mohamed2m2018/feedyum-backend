const Message = require('../../models/message');

const markChatAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { senderId } = req.params;
    const { orderId } = req.query; // Optional: filter by specific order

    if (!senderId) {
      return res.status(400).json({
        message: 'Sender ID is required'
      });
    }

    // Build query - filter by order if provided (for order-specific chats)
    const query = {
      sender: senderId,
      receiver: userId,
      isRead: false,
      isDeleted: false
    };

    // If orderId is provided, only mark messages for that specific order as read
    if (orderId) {
      query.order = orderId;
    }

    // Mark unread messages as read
    const result = await Message.updateMany(
      query,
      {
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read for user ${userId} from sender ${senderId}${orderId ? ` for order ${orderId}` : ''}`);

    // Emit updated badge counts via socket for real-time UI update
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        const { getBadgeCounts } = socketModule;
        const badgeCounts = await getBadgeCounts(userId.toString());
        io.to(userId.toString()).emit('badgeCountsUpdate', badgeCounts);
        console.log('[markChatAsRead] Emitted badge counts update to user:', userId);
      }
    } catch (socketError) {
      console.warn('[markChatAsRead] Failed to emit socket event:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: 'All messages from this chat marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark chat as read error:', error);
    res.status(500).json({
      message: 'Failed to mark chat as read',
      error: error.message
    });
  }
};

module.exports = markChatAsRead; 