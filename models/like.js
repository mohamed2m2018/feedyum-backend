const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
  },
  comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comment',
  },
  reply_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'comment',
  },
  created_at: {
    type: Date,
    default: Date.now
  },
});

const Like = mongoose.model('like', likeSchema);

module.exports = Like;