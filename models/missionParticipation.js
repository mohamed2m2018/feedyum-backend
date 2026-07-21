const mongoose = require("mongoose");
const { generateReferralCode } = require("../config/missionConfig");

const MissionParticipationSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mission",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  status: {
    type: String,
    enum: ['accepted', 'content_submitted', 'under_review', 'active', 'completed', 'rejected', 'withdrawn'],
    default: 'accepted',
  },

  storyId: { type: mongoose.Schema.Types.ObjectId, ref: "story" },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  rejectionReason: String,

  scoutedRestaurantProfile: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  googlePlaceId: String,
  scoutedRestaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'scoutedRestaurant' },
  submissionIdempotencyKey: String,

  referralCode: {
    type: String,
    unique: true,
    required: true,
  },

  metrics: {
    totalViews: { type: Number, default: 0 },
    totalOrdersGenerated: { type: Number, default: 0 },
    totalRevenueGenerated: { type: Number, default: 0 },
    totalCommissionEarned: { type: Number, default: 0 },
    milestonesReached: { type: [String], default: [] },
  },

  rank: { type: Number, default: 0 },

  acceptedAt: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MissionParticipationSchema.index({ mission: 1, user: 1 }, { unique: true });
MissionParticipationSchema.index({ mission: 1, rank: 1 });
MissionParticipationSchema.index({ user: 1, status: 1 });
MissionParticipationSchema.index({ referralCode: 1 }, { unique: true });
MissionParticipationSchema.index({ storyId: 1 });
MissionParticipationSchema.index(
  { mission: 1, googlePlaceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googlePlaceId: { $type: 'string' },
      status: { $in: ['content_submitted', 'under_review', 'active', 'completed'] },
    },
  },
);
MissionParticipationSchema.index(
  { user: 1, submissionIdempotencyKey: 1 },
  { unique: true, sparse: true },
);

MissionParticipationSchema.pre('validate', function (next) {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode();
  }
  next();
});

const MissionParticipation = mongoose.model("missionParticipation", MissionParticipationSchema);

module.exports = MissionParticipation;
