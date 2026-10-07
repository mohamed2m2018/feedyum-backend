const mongoose = require('mongoose');

// Sign-up requests submitted from the "Join as a chef" page on feedyum.com.
const ChefApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  businessName: { type: String, trim: true, maxlength: 160 },
  businessType: {
    type: String,
    enum: ['home_chef', 'restaurant'],
    required: true,
  },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  area: { type: String, required: true, trim: true, maxlength: 120 },
  cuisine: { type: String, trim: true, maxlength: 300 },
  socialLink: { type: String, trim: true, maxlength: 300 },
  notes: { type: String, trim: true, maxlength: 1000 },
  language: { type: String, enum: ['en', 'ar'], default: 'en' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'onboarded', 'rejected'],
    default: 'new',
  },
  notificationSent: { type: Boolean, default: false },
}, { timestamps: true });

ChefApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('chefApplication', ChefApplicationSchema);
