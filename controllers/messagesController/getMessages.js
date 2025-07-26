const Message = require('../../models/message');
const User = require('../../models/user');

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { otherUserId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    if (!otherUserId) {
      return res.status(400).json({
        message: 'Other user ID is required'
      });
    }

    // Verify that the other user exists
    const otherUser = await User.findById(otherUserId).select('fullName username avatar type');
    if (!otherUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Get messages between current user and other user (including deleted ones for context)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .sort({ timestamp: -1 }) // Most recent first
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('sender', 'fullName username avatar')
    .populate('receiver', 'fullName username avatar');

    // Reverse to show oldest first in chat UI
    const orderedMessages = messages.reverse();

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    });

    res.json({
      messages: orderedMessages,
      otherUser,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: page < Math.ceil(totalMessages / limit)
      },
      message: 'Messages fetched successfully'
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

module.exports = getMessages; 