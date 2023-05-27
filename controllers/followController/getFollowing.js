const mongoose = require('mongoose');

// Validations

// Models
const Follow = mongoose.model('follow');

async function getFollowing(req, res) {
  try {
    const user = req.params.userId; // Assuming userId is passed as a route parameter

    // Retrieve the users followed by the user
    const following = await Follow.find({ follower_id: user }).populate('following_id');

    res.status(200).json({ following });
  } catch (error) {
    console.error('Error retrieving following users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports =
  getFollowing;
