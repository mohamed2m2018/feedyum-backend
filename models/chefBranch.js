const mongoose = require('mongoose');

const ChefBranchSchema = new mongoose.Schema({
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  // Complete address information
  addressDetails: {
    streetName: { type: String },
    buildingNumber: { type: String },
    area: { type: String },
    city: { type: String, required: true }, // Kept required for filtering
    state: { type: String },
    country: { type: String, required: true },
    postalCode: { type: String },
    formattedAddress: { type: String, required: true }
  },

  // Geographic coordinates
  location: {
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
  },

  // Branch information
  branchName: { type: String, required: true }, // e.g., "Main Branch", "Downtown Location"
  contactInfo: {
    phoneNumber: { type: String, required: true },
    countryCode: { type: String, required: true }
  },

  // Operational details
  isActive: { type: Boolean, default: true },
  operatingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String }, // Format: "09:00"
    closeTime: { type: String }, // Format: "22:00"
  }],

  // Timezone for this branch (IANA format, e.g. "Africa/Cairo")
  timezone: { type: String, default: 'Africa/Cairo' },

  // Manual override: 'auto' = follow operatingHours schedule,
  // 'forceOpen' = always open, 'forceClosed' = always closed
  manualOverride: {
    type: String,
    enum: ['auto', 'forceOpen', 'forceClosed'],
    default: 'auto'
  },

  // Delivery settings
  deliveryRadius: { type: Number, default: 10 }, // in kilometers
  deliveryFee: { type: Number, default: 0 }, // Fallback flat fee if no area fee is configured
  deliveryTiers: [{ // @deprecated — areaDeliveryFees takes precedence
    maxDistance: { type: Number, required: true }, // km
    fee: { type: Number, required: true },         // EGP
  }],
  // Area-specific delivery fees (replaces distance-based tiers)
  areaDeliveryFees: [{
    name: { type: String, required: true },       // Display name of the area
    placeId: { type: String, required: true },    // Google place_id for reliable matching
    fee: { type: Number, required: true },        // EGP configured by chef
    _id: false,
  }],
  minimumOrderAmount: { type: Number, default: 0 },

  // Areas within the delivery radius that the chef chooses NOT to deliver to.
  // Matched via Google place_id (language-agnostic, deterministic).
  excludedAreas: [{
    name: { type: String, required: true },      // Display name (e.g. "El Marg")
    placeId: { type: String, required: true },    // Google place_id for reliable matching
    _id: false,
  }],

  // Scheduling / Order Mode
  allowScheduledOrders: { type: Boolean, default: false }, // Legacy — use orderMode instead
  orderMode: { type: String, enum: ['asap', 'scheduled', 'both'], default: 'asap' },
  minLeadTime: { type: Number, default: 60 }, // Minimum lead time in minutes for scheduled orders
  slotDuration: { type: Number, default: 60 }, // Duration of each delivery slot in minutes (30, 60, 120, 180, 360)

  // Metadata
  isPrimary: { type: Boolean, default: false }, // Primary branch for the chef
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Indexes for better query performance
ChefBranchSchema.index({ chef: 1 });
ChefBranchSchema.index({ 'addressDetails.city': 1 });
ChefBranchSchema.index({ 'addressDetails.country': 1 });
ChefBranchSchema.index({ location: '2dsphere' }); // For geospatial queries
ChefBranchSchema.index({ chef: 1, isPrimary: 1 });
ChefBranchSchema.index({ isActive: 1 });

// Ensure only one primary branch per chef
ChefBranchSchema.index(
  { chef: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } }
);

// Update timestamp on save
ChefBranchSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Static method to get active branches by city
ChefBranchSchema.statics.getActiveByCity = function (city, country) {
  return this.find({
    'addressDetails.city': new RegExp(city, 'i'),
    'addressDetails.country': new RegExp(country, 'i'),
    isActive: true
  }).populate('chef', 'fullName avatar type');
};

// Static method to get branches within delivery radius
ChefBranchSchema.statics.getWithinDeliveryRadius = function (lat, long, maxDistance = 50) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [long, lat] },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    isActive: true
  }).populate('chef', 'fullName avatar type');
};

// Instance method to check if branch delivers to a location
ChefBranchSchema.methods.deliversTo = function (clientLat, clientLong) {
  const distance = this.calculateDistance(clientLat, clientLong);
  return distance <= this.deliveryRadius;
};

// Instance method to calculate distance to a point
ChefBranchSchema.methods.calculateDistance = function (lat, long) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.location.lat) * Math.PI / 180;
  const dLon = (long - this.location.long) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.location.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const ChefBranch = mongoose.model('chefBranch', ChefBranchSchema);

module.exports = ChefBranch; 