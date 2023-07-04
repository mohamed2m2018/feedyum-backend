const mongoose = require('mongoose');

// Validations

// Models
const Follow = mongoose.model('follow');

async function getFollowers(req, res) {
  try {
    const userId = req.query.userId; // Assuming userId is passed as a route parameter
    const currentUserId = req.user?._id; // Assuming current user's ID is available in req.user._id
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters
    const limit = parseInt(req.query.limit) || 10; // Get the limit from the query parameters


    // Retrieve the followers of the user with pagination
    const followers = await Follow.find({ following_id: userId })
      .populate('follower_id')
      .skip((page - 1) * limit)
      .limit(limit);

    const followersWithCurrentUserFollowed = await Promise.all(
      followers.map(async follower => {
        const currentUserFollowed = await Follow.exists({
          follower_id: currentUserId,
          following_id: follower.follower_id._id,
        });
        return {
          follower_id: follower.follower_id,
          currentUserFollowed,
        };
      })
    );

    res.status(200).json({ followers: followersWithCurrentUserFollowed });
  } catch (error) {
    console.error('Error retrieving followers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = getFollowers;
