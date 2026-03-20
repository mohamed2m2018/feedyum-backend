const Message = require('../../models/message');

const markAllChatsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    // Mark all unread messages received by this user as read
    const result = await Message.updateMany(
      {
        receiver: userId,
        isRead: false,
        isDeleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`Marked all ${result.modifiedCount} chats as read for user ${userId}`);

    // Emit updated badge counts via socket for real-time UI update
    try {
      const socketModule = require('../../socket');
      const io = socketModule.getIO();
      if (io) {
        const { getBadgeCounts } = socketModule;
        const badgeCounts = await getBadgeCounts(userId.toString());
        io.to(userId.toString()).emit('badgeCountsUpdate', badgeCounts);
        console.log('[markAllChatsAsRead] Emitted badge counts update to user:', userId);
      }
    } catch (socketError) {
      console.warn('[markAllChatsAsRead] Failed to emit socket event:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: 'All chats marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark all chats as read error:', error);
    res.status(500).json({
      message: 'Failed to mark all chats as read',
      error: error.message
    });
  }
};

module.exports = markAllChatsAsRead;
