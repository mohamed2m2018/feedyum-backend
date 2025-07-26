const Message = require('../../models/message');

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({
        message: 'Message ID is required'
      });
    }

    // Find the message and verify ownership
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        message: 'Message not found'
      });
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You can only delete your own messages'
      });
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      return res.status(400).json({
        message: 'Message is already deleted'
      });
    }

    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

module.exports = deleteMessage;