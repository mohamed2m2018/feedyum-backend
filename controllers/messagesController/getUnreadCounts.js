const Message = require('../../models/message');

const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total unread messages count
    const totalUnreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      isDeleted: false
    });

    // Get unread messages count grouped by sender
    const unreadBySender = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          isRead: false,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
          lastMessage: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $unwind: '$senderInfo'
      },
      {
        $project: {
          senderId: '$_id',
          count: 1,
          lastMessage: 1,
          senderName: '$senderInfo.fullName',
          senderAvatar: '$senderInfo.avatar',
          senderUsername: '$senderInfo.username'
        }
      },
      {
        $sort: { lastMessage: -1 }
      }
    ]);

    // Get order-related unread messages count
    const orderUnreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      isDeleted: false,
      order: { $ne: null }
    });

    console.log(`Unread counts for user ${userId}:`, {
      totalUnreadCount,
      orderUnreadCount,
      chatUnreadCount: totalUnreadCount - orderUnreadCount,
      unreadBySenderCount: unreadBySender.length
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnreadCount,
        orderUnreadCount,
        unreadBySender
      }
    });

  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({
      message: 'Failed to get unread message counts',
      error: error.message
    });
  }
};

module.exports = getUnreadCounts; 