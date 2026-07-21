const mongoose = require('mongoose');
const Mission = require('../../models/mission');
const MissionParticipation = require('../../models/missionParticipation');
const ScoutedRestaurant = require('../../models/scoutedRestaurant');
const Story = require('../../models/story');

const withdrawFromMission = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let participation;
    await session.withTransaction(async () => {
      participation = await MissionParticipation.findOne({
        mission: req.params.id,
        user: req.user._id,
        status: { $in: ['accepted', 'content_submitted', 'rejected'] },
      }).session(session);
      if (!participation) { const error = new Error('Withdrawable participation not found'); error.status = 409; throw error; }
      if (participation.scoutedRestaurant) {
        const restaurant = await ScoutedRestaurant.findById(participation.scoutedRestaurant).session(session);
        if (restaurant && restaurant.status !== 'unclaimed') {
          const error = new Error('Cannot withdraw while a restaurant claim is pending or completed'); error.status = 409; throw error;
        }
        await ScoutedRestaurant.deleteOne({ _id: participation.scoutedRestaurant }, { session });
      }
      if (participation.storyId) {
        await Story.updateOne({ _id: participation.storyId }, {
          $unset: { missionId: 1, participationId: 1, referralCode: 1 },
        }, { session });
      }
      participation.status = 'withdrawn';
      participation.updatedAt = new Date();
      await participation.save({ session });
      await Mission.updateOne({ _id: req.params.id, currentParticipants: { $gt: 0 } }, { $inc: { currentParticipants: -1 } }, { session });
    });
    return res.json({ success: true, message: 'Successfully withdrawn from mission', data: participation });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Error withdrawing from mission' });
  } finally {
    await session.endSession();
  }
};

module.exports = withdrawFromMission;
