const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'order', default: null }, // Link to specific order
  content: String,
  audio: String, // URL to the audio file
  duration: Number, // Duration in seconds
  messageType: {
    type: String,
    enum: ['text', 'audio', 'image', 'price_offer', 'quote_request'],
    default: 'text'
  },
  // Price offer fields (only used when messageType === 'price_offer')
  priceOffer: {
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'dish' },
    dishName: String,
    offeredPrice: Number,
    currency: { type: String, default: 'EGP' },
    selectedOptions: [String],
    note: String,
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
    respondedAt: Date,
  },
  // Quote request fields (only used when messageType === 'quote_request')
  quoteRequest: {
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'dish' },
    dishName: String,
    selectedOptions: [String],
    notes: String,
  },
  isRead: { type: Boolean, default: false }, // Track if message has been read
  readAt: { type: Date }, // When message was read
  isEdited: { type: Boolean, default: false }, // Track if message has been edited
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  deletedAt: { type: Date }, // When message was deleted
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'message', default: null }, // Reply reference
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('message', messageSchema);
