const Notification = require('../../models/notification');

const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    const { markAll = false } = req.body;

    if (markAll) {
      // Mark all unread notifications as read
      const result = await Notification.updateMany(
        {
          recipient: userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        updatedCount: result.modifiedCount
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        message: 'Notification ID is required'
      });
    }

    // Find the notification and ensure the current user is the recipient
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found or you are not authorized'
      });
    }

    // Update the notification as read
    await Notification.findByIdAndUpdate(notificationId, {
      isRead: true,
      readAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

module.exports = markNotificationAsRead; 