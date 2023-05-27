const mongoose = require('mongoose');

// Validations

// Models
const Follow = mongoose.model('follow');

async function getFollowers(req, res) {
  try {
    const user = req.params.userId; // Assuming userId is passed as a route parameter

    // Retrieve the followers of the user
    const followers = await Follow.find({ following_id: user }).populate('follower_id');

    res.status(200).json({ followers });
  } catch (error) {
    console.error('Error retrieving followers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = 
  getFollowers;