const User = require('../models/user');
const ScoutedRestaurant = require('../models/scoutedRestaurant');

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value) {
  return value * Math.PI / 180;
}

function distanceMeters(a, b) {
  if (![a?.lat, a?.lng, b?.lat, b?.lng].every(Number.isFinite)) return Infinity;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function normalizeTarget(mission) {
  if (mission.target) return mission.target;
  if (mission.targetGooglePlaceId) {
    return {
      mode: 'exact_place',
      placeId: mission.targetGooglePlaceId,
      name: mission.targetRestaurantName,
      address: mission.targetRestaurantAddress,
    };
  }
  return null;
}

function validateTarget(mission, place) {
  if (mission.type !== 'scouting') return { eligible: true };
  const target = normalizeTarget(mission);
  if (!target) return { eligible: false, reason: 'MISSION_TARGET_MISSING' };
  if (!place?.placeId) return { eligible: false, reason: 'PLACE_ID_REQUIRED' };

  if (target.mode === 'exact_place' && place.placeId !== target.placeId) {
    return { eligible: false, reason: 'WRONG_PLACE' };
  }
  if (target.mode === 'area') {
    const distance = distanceMeters(target.center, place.location);
    if (distance > target.radiusMeters) {
      return { eligible: false, reason: 'OUTSIDE_TARGET_AREA', distanceMeters: Math.round(distance) };
    }
    return { eligible: true, distanceMeters: Math.round(distance) };
  }
  return { eligible: true };
}

async function getPlatformStatus(placeId, session) {
  const [profile, scouted] = await Promise.all([
    User.findOne({ type: 'chef', googlePlaceId: placeId }).session(session || null).select('_id').lean(),
    ScoutedRestaurant.findOne({ googlePlaceId: placeId }).session(session || null).select('_id status profile').lean(),
  ]);
  if (profile) return { eligible: false, reason: 'ALREADY_ON_PLATFORM', chefId: profile._id };
  if (scouted) return { eligible: false, reason: 'ALREADY_SCOUTED', scoutedRestaurantId: scouted._id };
  return { eligible: true };
}

async function evaluatePlace(mission, place, session) {
  const targetResult = validateTarget(mission, place);
  if (!targetResult.eligible) return targetResult;
  const platformResult = await getPlatformStatus(place.placeId, session);
  return { ...targetResult, ...platformResult };
}

module.exports = { distanceMeters, normalizeTarget, validateTarget, getPlatformStatus, evaluatePlace };
