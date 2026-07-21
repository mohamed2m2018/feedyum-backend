const Mission = require('../../models/mission');
const { searchRestaurants } = require('../../services/googlePlacesService');
const { evaluatePlace, normalizeTarget } = require('../../services/missionEligibilityService');
const { SCOUTING_ENABLED } = require('../../config/missionConfig');
const MissionParticipation = require('../../models/missionParticipation');

const searchPlaces = async (req, res) => {
  try {
    if (!SCOUTING_ENABLED) {
      return res.status(503).json({ success: false, code: 'SCOUTING_DISABLED', message: 'Scouting is temporarily unavailable' });
    }
    const query = String(req.query.query || '').trim();
    const { missionId } = req.query;
    if (query.length < 2) {
      return res.status(400).json({ success: false, code: 'QUERY_TOO_SHORT', message: 'Search query too short' });
    }
    if (!missionId) {
      return res.status(400).json({ success: false, code: 'MISSION_REQUIRED', message: 'missionId is required' });
    }

    const mission = await Mission.findById(missionId);
    if (!mission) return res.status(404).json({ success: false, code: 'MISSION_NOT_FOUND', message: 'Mission not found' });
    if (!mission.isActive() || mission.type !== 'scouting') {
      return res.status(409).json({ success: false, code: 'MISSION_NOT_SCOUTABLE', message: 'Mission is not available for scouting' });
    }

    const places = await searchRestaurants(query, normalizeTarget(mission));
    const participation = await MissionParticipation.findOne({ mission: mission._id, user: req.user._id })
      .populate('scoutedRestaurant', 'googlePlaceId')
      .lean();
    const results = await Promise.all(places.map(async place => {
      const eligibility = await evaluatePlace(mission, place);
      const isOwnResubmission = participation?.status === 'rejected'
        && participation.scoutedRestaurant?.googlePlaceId === place.placeId;
      if (isOwnResubmission) {
        eligibility.eligible = true;
        eligibility.reason = null;
        eligibility.scoutedRestaurantId = participation.scoutedRestaurant._id;
      }
      return {
        ...place,
        eligible: eligibility.eligible,
        inTargetArea: !['WRONG_PLACE', 'OUTSIDE_TARGET_AREA'].includes(eligibility.reason),
        eligibilityReason: eligibility.reason || null,
        distanceMeters: eligibility.distanceMeters ?? null,
        isOnPlatform: eligibility.reason === 'ALREADY_ON_PLATFORM',
        chefId: eligibility.chefId || null,
        scoutedRestaurantId: eligibility.scoutedRestaurantId || null,
      };
    }));

    console.log(JSON.stringify({ event: 'scouting.place_search_succeeded', missionId, userId: req.user._id, resultCount: results.length }));
    return res.json({
      success: true,
      data: results,
      attribution: { provider: 'Google', required: true },
    });
  } catch (error) {
    const notConfigured = error.code === 'PLACES_NOT_CONFIGURED';
    console.error(JSON.stringify({ event: 'scouting.place_search_failed', message: error.message }));
    return res.status(notConfigured ? 503 : 502).json({
      success: false,
      code: notConfigured ? 'PLACES_NOT_CONFIGURED' : 'PLACES_UNAVAILABLE',
      message: notConfigured ? 'Restaurant search is not configured' : 'Restaurant search is temporarily unavailable',
    });
  }
};

module.exports = searchPlaces;
