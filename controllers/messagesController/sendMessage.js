const Message = require('../../models/message');
const User = require('../../models/user');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content, messageType = 'text' } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        message: 'Receiver ID and message content are required'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        message: 'Message content cannot be empty'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        message: 'Message too long. Maximum 1000 characters allowed.'
      });
    }

    // Verify that the receiver exists and get their details
    const receiver = await User.findById(receiverId).select('fullName username avatar');
    if (!receiver) {
      return res.status(404).json({
        message: 'Receiver not found'
      });
    }

    // Get sender details for notifications
    const sender = await User.findById(senderId).select('fullName username avatar');
    if (!sender) {
      return res.status(404).json({
        message: 'Sender not found'
      });
    }

    // Create and save the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      messageType: messageType,
      timestamp: new Date()
    });

    await message.save();

    // Populate sender and receiver info for response
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');

    // Send push notification to receiver
    try {
      await EnhancedNotificationService.sendChatNotification({
        recipientId: receiverId.toString(),
        senderId: senderId.toString(),
        senderName: sender.fullName,
        message: content.trim(),
        chatId: senderId.toString(), // Use sender ID as chat ID
        senderAvatar: sender.avatar,
        messageType: messageType
      });

      console.log(`Chat notification sent from ${sender.fullName} to ${receiver.fullName}`);
    } catch (notificationError) {
      console.error('Failed to send chat notification:', notificationError);
      // Don't fail the message sending if notification fails
    }

    res.status(201).json({
      message: message,
      success: true,
      responseMessage: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Failed to send message',
      error: error.message
    });
  }
};

module.exports = sendMessage; 