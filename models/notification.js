const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  type: { 
    type: String, 
    enum: ['message', 'order', 'like', 'comment', 'follow', 'review', 'promotion'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of related entity (order, dish, etc.)
  targetType: { 
    type: String, 
    enum: ['order', 'dish', 'story', 'user', 'promocode', 'menu'],
    required: false
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data for deep linking
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // Optional expiration date
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('notification', notificationSchema); 