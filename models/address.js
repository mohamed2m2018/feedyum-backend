const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Address schema

const AddressSchema = new Schema({
    // Existing fields
    nameLine: String,
    location: {
        lat: String,
        long: String,
    },
    isPrimary: Boolean, 
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    
    // New enhanced fields
    label: { type: String, required: true, default: 'Home' }, // "Home", "Work", etc.
    addressType: { 
        type: String, 
        enum: ['apartment', 'house', 'office'], 
        default: 'house' 
    },
    buildingDetails: {
        buildingName: { type: String, default: '' },
        apartmentNumber: { type: String, default: '' },
        floorNumber: { type: String, default: '' }
    },
    streetDetails: {
        streetName: { type: String, default: '' },
        area: { type: String, default: '' },
        neighborhood: { type: String, default: '' }
    },
    contactInfo: {
        phoneNumber: { type: String, default: '' },
        countryCode: { type: String, default: '+20' }
    },
    formattedAddress: { type: String, default: '' }, // Full formatted address
    isCurrentLocation: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
AddressSchema.index({isPrimary: 1}, {unique: true, partialFilterExpression: {isPrimary: true}});
AddressSchema.index({owner: 1}); // Index for efficient user address queries
AddressSchema.index({owner: 1, isPrimary: 1}); // Compound index for primary address queries

// Pre-save middleware to update the updatedAt field
AddressSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Pre-update middleware to update the updatedAt field
AddressSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set({ updatedAt: new Date() });
    next();
});

const Address = mongoose.model('address', AddressSchema);
module.exports = Address;
