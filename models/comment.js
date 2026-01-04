const mongoose = require('mongoose');
const Reply = require('./reply');

const commentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  replies: [Reply.schema],
  likesNo: {
    type: Number,
    default: 0
  },
  likes: [{ // Array of user IDs who liked the comment
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }]
});

const Comment = mongoose.model('comment', commentSchema);

module.exports = Comment;