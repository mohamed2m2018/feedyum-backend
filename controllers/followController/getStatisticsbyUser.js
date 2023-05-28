const mongoose = require('mongoose');

// Validations

// Models
const Follow = mongoose.model('follow');

const getFollowStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    const followersCount = await Follow.countDocuments({ following_id: userId });
    const followingCount = await Follow.countDocuments({ follower_id: userId });

    res.json({ followersCount, followingCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch follow statistics' });
  }
};

module.exports =  getFollowStatistics ;