const Message = require('../../models/message');
const User = require('../../models/user');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content } = req.body;

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

    // Verify that the receiver exists
    const receiver = await User.findById(receiverId).select('fullName username');
    if (!receiver) {
      return res.status(404).json({
        message: 'Receiver not found'
      });
    }

    // Create and save the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      timestamp: new Date()
    });

    await message.save();

    // Populate sender and receiver info for response
    await message.populate('sender', 'fullName username avatar');
    await message.populate('receiver', 'fullName username avatar');

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