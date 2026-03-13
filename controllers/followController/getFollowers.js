const mongoose = require('mongoose');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

// Validations

// Models
const Follow = mongoose.model('follow');

async function getFollowers(req, res) {
  try {
    const userId = req.query.userId; // Assuming userId is passed as a route parameter
    const currentUserId = req.user?._id; // Assuming current user's ID is available in req.user._id
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters
    const limit = parseInt(req.query.limit) || 10; // Get the limit from the query parameters

    // Get blocked chef IDs
    const blockedChefIds = await getBlockedChefIds();
    const blockedIdStrings = new Set(blockedChefIds.map(id => id.toString()));

    // Retrieve the followers of the user with pagination
    const followers = await Follow.find({ following_id: userId })
      .populate('follower_id')
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter out blocked users
    const visibleFollowers = followers.filter(
      f => f.follower_id && !blockedIdStrings.has(f.follower_id._id.toString())
    );

    const followersWithCurrentUserFollowed = await Promise.all(
      visibleFollowers.map(async follower => {
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
