const mongoose = require('mongoose');
const Mission = require('../models/mission');
const MissionParticipation = require('../models/missionParticipation');
const Story = require('../models/story');
const ScoutedRestaurant = require('../models/scoutedRestaurant');
const { evaluatePlace, validateTarget } = require('./missionEligibilityService');
const { SCOUTING_ENABLED } = require('../config/missionConfig');

class MissionSubmissionError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function parseLocation(location) {
  if (!location) return null;
  const parsed = typeof location === 'string' ? JSON.parse(location) : location;
  const lat = Number(parsed.lat);
  const lng = Number(parsed.lng ?? parsed.long);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

async function submitMissionContent({ missionId, userId, storyId, place, idempotencyKey, session }) {
  if (!idempotencyKey) throw new MissionSubmissionError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency key is required');
  if (!mongoose.Types.ObjectId.isValid(storyId)) throw new MissionSubmissionError('INVALID_STORY', 'Valid storyId is required');

  const mission = await Mission.findById(missionId).session(session);
  if (!mission) throw new MissionSubmissionError('MISSION_NOT_FOUND', 'Mission not found', 404);
  if (mission.type === 'scouting' && !SCOUTING_ENABLED) throw new MissionSubmissionError('SCOUTING_DISABLED', 'Scouting is temporarily unavailable', 503);
  if (!mission.isActive()) throw new MissionSubmissionError('MISSION_NOT_ACTIVE', 'Mission is not currently active', 409);

  const participation = await MissionParticipation.findOne({ mission: missionId, user: userId }).session(session);
  if (!participation) throw new MissionSubmissionError('PARTICIPATION_NOT_FOUND', 'Participation not found', 404);
  if (participation.submissionIdempotencyKey === idempotencyKey && participation.storyId) return participation;
  if (!['accepted', 'rejected'].includes(participation.status)) {
    throw new MissionSubmissionError('INVALID_PARTICIPATION_STATE', 'This participation cannot accept a submission', 409);
  }

  const story = await Story.findOne({ _id: storyId, author: userId }).session(session);
  if (!story) throw new MissionSubmissionError('STORY_NOT_FOUND', 'Story not found or does not belong to the user', 404);

  let scoutedRestaurant = null;
  let normalizedLocation = null;
  if (mission.type === 'scouting') {
    normalizedLocation = parseLocation(place.location);
    const candidate = { ...place, location: normalizedLocation };
    const existingOwnRestaurant = participation.scoutedRestaurant
      ? await ScoutedRestaurant.findById(participation.scoutedRestaurant).session(session)
      : null;
    const eligibility = existingOwnRestaurant?.googlePlaceId === place.placeId
      ? validateTarget(mission, candidate)
      : await evaluatePlace(mission, candidate, session);
    if (!eligibility.eligible) {
      const messages = {
        ALREADY_ON_PLATFORM: 'This restaurant is already on FeedYum',
        ALREADY_SCOUTED: 'This restaurant has already been scouted',
        WRONG_PLACE: 'This restaurant is not the mission target',
        OUTSIDE_TARGET_AREA: 'This restaurant is outside the mission area',
      };
      throw new MissionSubmissionError(eligibility.reason, messages[eligibility.reason] || 'Restaurant is not eligible', 409);
    }
    if (!normalizedLocation) throw new MissionSubmissionError('LOCATION_REQUIRED', 'Restaurant location is required');

    if (existingOwnRestaurant?.googlePlaceId === place.placeId) {
      existingOwnRestaurant.name = place.name;
      existingOwnRestaurant.address = place.address;
      existingOwnRestaurant.location = normalizedLocation;
      await existingOwnRestaurant.save({ session });
      scoutedRestaurant = existingOwnRestaurant;
    } else {
      [scoutedRestaurant] = await ScoutedRestaurant.create([{
        googlePlaceId: place.placeId,
        name: place.name,
        address: place.address,
        location: normalizedLocation,
        scoutedBy: userId,
        participation: participation._id,
      }], { session });
    }
  }

  participation.storyId = storyId;
  participation.status = 'content_submitted';
  participation.submittedAt = new Date();
  participation.reviewedAt = undefined;
  participation.reviewedBy = undefined;
  participation.rejectionReason = undefined;
  participation.submissionIdempotencyKey = idempotencyKey;
  if (scoutedRestaurant) {
    participation.googlePlaceId = scoutedRestaurant.googlePlaceId;
    participation.scoutedRestaurant = scoutedRestaurant._id;
  }
  await participation.save({ session });

  story.missionId = mission._id;
  story.participationId = participation._id;
  story.referralCode = participation.referralCode;
  if (scoutedRestaurant) {
    story.googlePlaceId = scoutedRestaurant.googlePlaceId;
    story.location = normalizedLocation;
  }
  await story.save({ session });
  return participation;
}

module.exports = { submitMissionContent, MissionSubmissionError, parseLocation };
