const Notification = require('../../models/notification');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type, isRead } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { recipient: userId };
    
    if (type) {
      filter.type = type;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

module.exports = getNotifications; 