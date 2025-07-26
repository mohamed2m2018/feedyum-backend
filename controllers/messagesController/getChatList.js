const Message = require('../../models/message');
const User = require('../../models/user');

const getChatList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique conversations (users who have exchanged messages with current user)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          latestMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { 'latestMessage.timestamp': -1 }
      }
    ]);

    if (conversations.length === 0) {
      return res.json({
        chatUsers: [],
        message: 'No conversations found'
      });
    }

    // Get user details for each conversation
    const chatUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv._id;
        const user = await User.findById(otherUserId).select('fullName username avatar type bio');
        
        if (!user) {
          return null;
        }

        return {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
          type: user.type,
          bio: user.bio,
          latestMessage: {
            content: conv.latestMessage.content,
            timestamp: conv.latestMessage.timestamp,
            isFromCurrentUser: conv.latestMessage.sender.toString() === userId.toString()
          },
          messageCount: conv.messageCount
        };
      })
    );

    // Filter out null values (in case some users were deleted)
    const validChatUsers = chatUsers.filter(user => user !== null);

    res.json({
      chatUsers: validChatUsers,
      message: 'Chat list fetched successfully'
    });

  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({
      message: 'Failed to fetch chat list',
      error: error.message
    });
  }
};

module.exports = getChatList; 