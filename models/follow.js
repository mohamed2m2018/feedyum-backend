const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  following_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Follow = mongoose.model('follow', followSchema);

module.exports = Follow;