const mongoose = require("mongoose");

const MissionAttributionSchema = new mongoose.Schema({
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "story",
    required: true,
  },
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  participationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "missionParticipation",
    required: true,
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "mission",
    required: true,
  },
  chefId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  referralCode: String,

  source: {
    type: String,
    enum: ['deep_link', 'in_app_view', 'share_link', 'qr_code'],
    default: 'in_app_view',
  },

  viewedAt: { type: Date, default: Date.now, required: true },
  expiresAt: { type: Date, required: true },

  converted: { type: Boolean, default: false },
  convertedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
  convertedAt: Date,
  commissionAmount: Number,
  reversedAt: Date,
  reversalReason: String,
});

MissionAttributionSchema.index({ viewer: 1, chefId: 1, expiresAt: 1 });
MissionAttributionSchema.index({ storyId: 1, viewer: 1 }, { unique: true });
MissionAttributionSchema.index({ ambassador: 1, converted: 1 });
MissionAttributionSchema.index({ expiresAt: 1 });

const MissionAttribution = mongoose.model("missionAttribution", MissionAttributionSchema);

module.exports = MissionAttribution;
