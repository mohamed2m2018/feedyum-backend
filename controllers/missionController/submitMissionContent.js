const mongoose = require('mongoose');
const { submitMissionContent: submit, MissionSubmissionError } = require('../../services/missionSubmissionService');

const submitMissionContent = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let participation;
    await session.withTransaction(async () => {
      participation = await submit({
        missionId: req.params.id,
        userId: req.user._id,
        storyId: req.body.storyId,
        idempotencyKey: req.get('Idempotency-Key') || req.body.idempotencyKey,
        place: {
          placeId: req.body.googlePlaceId,
          name: req.body.restaurantName,
          address: req.body.restaurantAddress,
          location: req.body.location,
        },
        session,
      });
    });
    console.log(JSON.stringify({ event: 'scouting.submission_succeeded', missionId: req.params.id, userId: req.user._id, participationId: participation._id }));
    return res.status(200).json({ success: true, message: 'Content submitted successfully', data: participation });
  } catch (error) {
    if (error instanceof MissionSubmissionError || error.code === 11000) {
      return res.status(error.status || 409).json({
        success: false,
        code: error.code === 11000 ? 'DUPLICATE_SUBMISSION' : error.code,
        message: error.code === 11000 ? 'This restaurant or submission has already been used' : error.message,
      });
    }
    console.error(JSON.stringify({ event: 'scouting.submission_failed', missionId: req.params.id, userId: req.user._id, message: error.message }));
    return res.status(500).json({ success: false, code: 'SUBMISSION_FAILED', message: 'Error submitting mission content' });
  } finally {
    await session.endSession();
  }
};

module.exports = submitMissionContent;
