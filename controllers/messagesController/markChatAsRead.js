const Message = require('../../models/message');

const markChatAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { senderId } = req.params;

    if (!senderId) {
      return res.status(400).json({
        message: 'Sender ID is required'
      });
    }

    // Mark all unread messages from this sender as read
    const result = await Message.updateMany(
      {
        sender: senderId,
        receiver: userId,
        isRead: false,
        isDeleted: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as read for user ${userId} from sender ${senderId}`);

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