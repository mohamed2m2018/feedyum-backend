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
    enum: ['text', 'audio'], 
    default: 'text' 
  },
  isRead: { type: Boolean, default: false }, // Track if message has been read
  readAt: { type: Date }, // When message was read
  isEdited: { type: Boolean, default: false }, // Track if message has been edited
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  deletedAt: { type: Date }, // When message was deleted
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('message', messageSchema);
