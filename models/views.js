// models/views.js

const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  // Enhanced engagement tracking
  watchDuration: {
    type: Number,
    default: 0  // seconds watched
  },
  totalDuration: {
    type: Number,
    default: 0  // total video length in seconds
  },
  completionRate: {
    type: Number,
    default: 0,  // 0-1 percentage
    min: 0,
    max: 1
  },
  rewatched: {
    type: Boolean,
    default: false
  },
  shared: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['forYou', 'following', 'profile', 'search', 'direct'],
    default: 'forYou'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for fast user view lookups
viewSchema.index({ user_id: 1, story: 1 });
viewSchema.index({ user_id: 1, created_at: -1 });
viewSchema.index({ story: 1, created_at: -1 });

const View = mongoose.model('view', viewSchema);

module.exports = View;
