const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Menu Upload Request - Talabat-style first-time menu submission
 * Chef uploads photos/PDFs of their existing menu,
 * FeedYum team reviews and enters dishes into the system
 */
const MenuUploadSchema = new Schema({
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true,
    },
    files: [{
        url: { type: String },
        key: { type: String },
        type: { type: String }, // 'image' or 'document'
        originalName: { type: String },
    }],
    notes: {
        type: String,
        default: '',
    },
    restaurantName: {
        type: String,
    },
    phone: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        default: 'pending',
        index: true,
    },
    adminNotes: {
        type: String,
        default: '',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

MenuUploadSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('menuUpload', MenuUploadSchema);
