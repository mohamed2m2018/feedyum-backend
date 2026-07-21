const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['business_license', 'tax_document', 'utility_bill', 'authorization_letter', 'other'],
    required: true,
  },
  objectKey: { type: String, required: true, maxlength: 512 },
  fileName: { type: String, required: true, maxlength: 255 },
  contentType: { type: String, required: true },
  size: { type: Number, required: true, max: 10 * 1024 * 1024 },
}, { _id: true });

const RestaurantClaimSchema = new mongoose.Schema({
  scoutedRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'scoutedRestaurant',
    required: true,
  },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  contactName: { type: String, required: true, trim: true, maxlength: 120 },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  contactPhone: { type: String, required: true, trim: true, maxlength: 40 },
  relationship: {
    type: String,
    enum: ['owner', 'manager', 'authorized_representative'],
    required: true,
  },
  evidence: {
    type: [EvidenceSchema],
    validate: value => Array.isArray(value) && value.length > 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  reviewReason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  reviewedByAdminEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
  reviewedAt: Date,
  idempotencyKey: { type: String, required: true, maxlength: 160 },
}, { timestamps: true });

RestaurantClaimSchema.index({ claimant: 1, idempotencyKey: 1 }, { unique: true });
RestaurantClaimSchema.index(
  { scoutedRestaurant: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
RestaurantClaimSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('restaurantClaim', RestaurantClaimSchema);
