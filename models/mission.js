const mongoose = require("mongoose");

const MilestoneSchema = new mongoose.Schema({
  threshold: { type: Number, required: true },
  rewardAmount: { type: Number, required: true },
  rewardType: { type: String, enum: ['fixed_bonus', 'percentage_boost'], default: 'fixed_bonus' },
  description: String,
  descriptionAr: String,
}, { _id: true });

const MissionTargetSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['exact_place', 'area'],
    required: true,
  },
  placeId: String,
  name: String,
  address: String,
  center: {
    lat: Number,
    lng: Number,
  },
  radiusMeters: Number,
}, { _id: false });

const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleAr: String,
  description: { type: String, required: true },
  descriptionAr: String,
  coverImage: String,

  type: {
    type: String,
    enum: ['scouting', 'reviewing'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'expired'],
    default: 'draft',
  },

  // Reviewing missions — target an existing restaurant
  targetChefId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

  // Scouting missions — target a restaurant not on the platform
  targetGooglePlaceId: String,
  targetRestaurantName: String,
  targetRestaurantAddress: String,

  targetArea: String,
  target: MissionTargetSchema,

  rewards: {
    scoutBonusFixed: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 0 },
    commissionCap: { type: Number, default: null },
    milestones: [MilestoneSchema],
  },

  maxParticipants: { type: Number, default: null },
  currentParticipants: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  attributionWindowDays: {
    type: Number,
    default: 7,
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  created_at: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

MissionSchema.index({ type: 1, status: 1 });
MissionSchema.index({ targetChefId: 1 });
MissionSchema.index({ targetGooglePlaceId: 1 });
MissionSchema.index({ status: 1, startDate: 1, endDate: 1 });
MissionSchema.index({ targetArea: 1, status: 1 });

MissionSchema.pre('validate', function (next) {
  if (this.type !== 'scouting') return next();

  if (!this.target) {
    if (this.targetGooglePlaceId) {
      this.target = {
        mode: 'exact_place',
        placeId: this.targetGooglePlaceId,
        name: this.targetRestaurantName,
        address: this.targetRestaurantAddress,
      };
    } else if (this.targetArea) {
      // Preserve legacy records during staged migration; all newly-created
      // area missions must use the structured target below.
      if (!this.isNew) return next();
      return next(new Error('Area scouting missions require target.center and target.radiusMeters'));
    }
  }

  if (!this.target) return next(new Error('Scouting missions require a target'));
  if (this.target.mode === 'exact_place' && !this.target.placeId) {
    return next(new Error('Exact-place missions require target.placeId'));
  }
  if (this.target.mode === 'area') {
    const { center, radiusMeters } = this.target;
    if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng)) {
      return next(new Error('Area missions require valid target.center coordinates'));
    }
    if (!Number.isFinite(radiusMeters) || radiusMeters < 100 || radiusMeters > 100000) {
      return next(new Error('Area mission radius must be between 100 and 100000 meters'));
    }
  }
  next();
});

MissionSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate > now;
};

MissionSchema.methods.isFull = function () {
  if (!this.maxParticipants) return false;
  return this.currentParticipants >= this.maxParticipants;
};

const Mission = mongoose.model("mission", MissionSchema);

module.exports = Mission;
