const mongoose = require('mongoose');

const ScoutedRestaurantSchema = new mongoose.Schema({
  googlePlaceId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['unclaimed', 'claim_pending', 'claimed', 'merged'],
    default: 'unclaimed',
  },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  scoutedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  participation: { type: mongoose.Schema.Types.ObjectId, ref: 'missionParticipation', required: true },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  claimedAt: Date,
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

ScoutedRestaurantSchema.index({ googlePlaceId: 1 }, { unique: true });
ScoutedRestaurantSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('scoutedRestaurant', ScoutedRestaurantSchema);
