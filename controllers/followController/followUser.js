const mongoose = require('mongoose');

// Validations

// Models
const Follow = mongoose.model('follow');

async function followUser(req, res) {
  try {
    const { userToFollow } = req.body; // Assuming currentUser and userToFollow are passed in the request body

    // Create a new follow document
    const follow = new Follow({
      follower_id: req.user._id,
      following_id: userToFollow._id
    });

    // Save the follow document to the database
    await follow.save();

    res.status(201).json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = followUser;

