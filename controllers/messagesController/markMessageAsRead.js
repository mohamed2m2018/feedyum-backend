const Message = require('../../models/message');

const markMessageAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({
        message: 'Message ID is required'
      });
    }

    // Find the message and ensure the current user is the receiver
    const message = await Message.findOne({
      _id: messageId,
      receiver: userId,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({
        message: 'Message not found or you are not authorized to mark it as read'
      });
    }

    // Update the message as read
    await Message.findByIdAndUpdate(messageId, {
      isRead: true,
      readAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

module.exports = markMessageAsRead; 