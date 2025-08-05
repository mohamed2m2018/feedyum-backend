const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Create User model
const UserSchema = new Schema({
  username: String,
  email: String,
  password: String,
  type: String, // 'chef' for restaurants, others for different types
  locations: [new mongoose.Schema({
    description: String,
    lat: Number,
    long: Number,
  })],
  avatar: String,
  fullName: String,
  phone: String,
  discount: {
    maxAmount: Number,
    percentageAmount: Number,
    coupon: String,
  },
  gender: String,
  date: {
    type: Date,
    default: Date.now,
  },
  pushNotificationToken: String,
  wallet: Number,
  profileCompleted: Boolean,
  currentUserFollowed: Boolean,
  postsNo: Number,
  likesNo: Number,
  isGoogleUser: Boolean,
  bio: String,
  hasMenu: {
    type: Boolean,
    default: false,
  },
  tags: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'tag'  // Reference to the Tag model
  }],
  favorites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'dish'  // Reference to favorite dishes
  }],
  
  // Location-based features for chefs
  chefSettings: {
    country: { type: String }, // Fixed country based on first branch
    currency: { type: String }, // Automatically set based on country
    currencySymbol: { type: String }, // Currency symbol for display
    isCountryLocked: { type: Boolean, default: false }, // Once set, cannot be changed
    totalBranches: { type: Number, default: 0 }, // Count of active branches
    hasBranches: { type: Boolean, default: false } // Whether chef has any branches
  },
  
  // Enhanced location data (keeping for backward compatibility)
  locations: [new mongoose.Schema({
    description: String,
    lat: Number,
    long: Number,
  })],
  
  // Semantic search embedding - excluded by default for performance
  embedding: { type: [Number], default: null, select: false },
  embeddingGenerated: { type: Date, default: null, select: false },
});

// Pre-save middleware to handle currency setting
UserSchema.pre('save', function(next) {
  // Auto-set currency based on country for chefs
  if (this.type === 'chef' && this.chefSettings?.country && !this.chefSettings.currency) {
    const currencyMap = {
      'United Kingdom': { currency: 'GBP', symbol: '£' },
      'United States': { currency: 'USD', symbol: '$' },
      'Canada': { currency: 'CAD', symbol: 'C$' },
      'Australia': { currency: 'AUD', symbol: 'A$' },
      'Egypt': { currency: 'EGP', symbol: '£E' },
      'France': { currency: 'EUR', symbol: '€' },
      'Germany': { currency: 'EUR', symbol: '€' },
      'Spain': { currency: 'EUR', symbol: '€' },
      'Italy': { currency: 'EUR', symbol: '€' },
      'India': { currency: 'INR', symbol: '₹' },
      'Japan': { currency: 'JPY', symbol: '¥' },
      'China': { currency: 'CNY', symbol: '¥' },
      'Brazil': { currency: 'BRL', symbol: 'R$' },
      'Mexico': { currency: 'MXN', symbol: '$' },
      'South Africa': { currency: 'ZAR', symbol: 'R' },
      'UAE': { currency: 'AED', symbol: 'د.إ' },
      'Saudi Arabia': { currency: 'SAR', symbol: 'ر.س' }
    };
    
    const countryData = currencyMap[this.chefSettings.country];
    if (countryData) {
      this.chefSettings.currency = countryData.currency;
      this.chefSettings.currencySymbol = countryData.symbol;
    } else {
      // Default to USD if country not found
      this.chefSettings.currency = 'USD';
      this.chefSettings.currencySymbol = '$';
    }
  }
  
  next();
});

// Instance method to check if chef can add branches in a country
UserSchema.methods.canAddBranchInCountry = function(country) {
  if (this.type !== 'chef') return false;
  
  // If no country set yet, can add in any country
  if (!this.chefSettings?.country || !this.chefSettings.isCountryLocked) {
    return true;
  }
  
  // If country is locked, can only add in the same country
  return this.chefSettings.country === country;
};

// Instance method to set chef country (one-time only)
UserSchema.methods.setChefCountry = function(country) {
  if (this.type !== 'chef') return false;
  
  // If already locked, cannot change
  if (this.chefSettings?.isCountryLocked) return false;
  
  // Initialize chefSettings if not exists
  if (!this.chefSettings) {
    this.chefSettings = {};
  }
  
  this.chefSettings.country = country;
  this.chefSettings.isCountryLocked = true;
  
  return true;
};

// Performance optimization indexes for discover functionality:
// Add this near the end of the user schema definition
UserSchema.index({ tags: 1 }); // Index for tag-based user queries in discover
UserSchema.index({ embedding: 1 }); // Index for semantic search
UserSchema.index({ type: 1, embedding: 1 }); // Compound index for semantic search with user type

const User = mongoose.model('user', UserSchema);

module.exports = User;
