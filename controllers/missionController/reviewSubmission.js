const MissionParticipation = require('../../models/missionParticipation');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');

const reviewSubmission = async (req, res) => {
  try {
    const { pid } = req.params;
    const { action, rejectionReason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be approve or reject',
      });
    }

    const participation = await MissionParticipation.findById(pid);
    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Participation not found',
      });
    }

    if (participation.status !== 'content_submitted') {
      return res.status(400).json({
        success: false,
        message: 'Only submissions with status content_submitted can be reviewed',
      });
    }

    if (action === 'approve') {
      participation.status = 'active';
      participation.reviewedAt = Date.now();
      participation.reviewedBy = req.user._id;
    } else {
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required when rejecting a submission',
        });
      }
      participation.status = 'rejected';
      participation.rejectionReason = rejectionReason;
      participation.reviewedAt = Date.now();
      participation.reviewedBy = req.user._id;
    }

    participation.updatedAt = Date.now();
    await participation.save();

    // Notify ambassador about the review result (non-blocking)
    try {
      const notifTitle = action === 'approve'
        ? 'Content Approved!'
        : 'Submission Needs Changes';
      const notifMessage = action === 'approve'
        ? 'Your content has been approved! Start sharing your link'
        : `Your submission needs changes: ${rejectionReason}`;

      await EnhancedNotificationService.sendNotification({
        userIds: [participation.user.toString()],
        title: notifTitle,
        message: notifMessage,
        type: 'mission',
        targetId: participation.mission.toString(),
        additionalData: {
          screen: 'MissionDetail',
          missionId: participation.mission.toString(),
          participationId: pid,
          reviewAction: action,
        },
      });
    } catch (notifErr) {
      console.error('[NOTIFICATION] Failed to send submission review notification:', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Submission ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: participation,
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reviewing submission',
    });
  }
};

module.exports = reviewSubmission;
