require('dotenv').config();
const mongoose = require('mongoose');
const keys = require('../config/keys');
require('../models/loadModels');

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(keys.mongoURI);
  const Participation = mongoose.model('missionParticipation');
  const User = mongoose.model('user');
  const ScoutedRestaurant = mongoose.model('scoutedRestaurant');
  const participations = await Participation.find({
    googlePlaceId: { $type: 'string', $ne: '' },
    scoutedRestaurant: { $exists: false },
  }).lean();
  const candidates = [];
  for (const participation of participations) {
    const profile = participation.scoutedRestaurantProfile
      ? await User.findById(participation.scoutedRestaurantProfile).lean()
      : null;
    const location = profile?.locations?.[0];
    candidates.push({
      participationId: participation._id,
      googlePlaceId: participation.googlePlaceId,
      name: profile?.fullName || 'Scouted Restaurant',
      address: location?.description || '',
      location: { lat: Number(location?.lat) || 0, lng: Number(location?.long) || 0 },
      scoutedBy: participation.user,
      profile: profile?._id,
      status: profile?.isUnclaimed === false ? 'claimed' : 'unclaimed',
    });
  }
  console.log(JSON.stringify({ dryRun: !apply, candidates: candidates.length }, null, 2));
  if (!apply) return;
  for (const candidate of candidates) {
    const restaurant = await ScoutedRestaurant.findOneAndUpdate(
      { googlePlaceId: candidate.googlePlaceId },
      { $setOnInsert: { ...candidate, participation: candidate.participationId } },
      { upsert: true, new: true },
    );
    await Participation.updateOne({ _id: candidate.participationId }, { $set: { scoutedRestaurant: restaurant._id } });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
