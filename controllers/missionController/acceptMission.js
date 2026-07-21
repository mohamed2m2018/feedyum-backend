const mongoose = require('mongoose');
const Mission = require('../../models/mission');
const MissionParticipation = require('../../models/missionParticipation');
const EnhancedNotificationService = require('../../services/enhancedNotificationService');
const { SCOUTING_ENABLED } = require('../../config/missionConfig');

const acceptMission = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let mission;
    let participation;
    await session.withTransaction(async () => {
      const now = new Date();
      mission = await Mission.findOneAndUpdate({
        _id: req.params.id,
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gt: now },
        $expr: {
          $or: [
            { $eq: [{ $ifNull: ['$maxParticipants', null] }, null] },
            { $lte: ['$maxParticipants', 0] },
            { $lt: ['$currentParticipants', '$maxParticipants'] },
          ],
        },
      }, { $inc: { currentParticipants: 1 } }, { new: true, session });
      if (!mission) {
        const exists = await Mission.exists({ _id: req.params.id }).session(session);
        const error = new Error(exists ? 'Mission is inactive or full' : 'Mission not found');
        error.status = exists ? 409 : 404;
        throw error;
      }
      if (mission.type === 'scouting' && !SCOUTING_ENABLED) {
        const error = new Error('Scouting is temporarily unavailable');
        error.status = 503;
        throw error;
      }
      [participation] = await MissionParticipation.create([{
        mission: mission._id,
        user: req.user._id,
        status: 'accepted',
      }], { session });
    });

    EnhancedNotificationService.sendNotification({
      userIds: [req.user._id.toString()],
      title: 'Mission Accepted!',
      message: `Start creating content for ${mission.title}`,
      type: 'mission',
      targetId: mission._id.toString(),
      additionalData: { screen: 'MissionDetail', missionId: mission._id.toString() },
    }).catch(error => console.error('[NOTIFICATION] Mission acceptance:', error.message));

    return res.status(201).json({ success: true, message: 'Mission accepted successfully', data: participation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, code: 'ALREADY_JOINED', message: 'You have already joined this mission' });
    }
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Error accepting mission' });
  } finally {
    await session.endSession();
  }
};

module.exports = acceptMission;
