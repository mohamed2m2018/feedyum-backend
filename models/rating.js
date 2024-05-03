const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Ensure this matches your User model's name
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'story', // Ensure this matches your Post model's name
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1, // Assuming 1 is the lowest rating
    max: 5 // Assuming 5 is the highest rating
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const Rating = mongoose.model('rating', ratingSchema);

module.exports = Rating;