const mongoose = require('mongoose');
const { getBlockedChefIds } = require('../../utils/getBlockedChefIds');

// Validations

// Models
const Follow = mongoose.model('follow');

async function getFollowing(req, res) {
  try {
    const userId = req.query.userId; // Assuming userId is passed as a route parameter
    const currentUserId = req.user._id; // Assuming current user's ID is available in req.user._id
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameters
    const limit = parseInt(req.query.limit) || 10; // Get the limit from the query parameters

    // Retrieve the users followed by the user with pagination
    const following = await Follow.find({ follower_id: userId })
      .populate('following_id')
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter out blocked users
    const blockedChefIds = await getBlockedChefIds();
    const blockedIdStrings = new Set(blockedChefIds.map(id => id.toString()));
    const visibleFollowing = following.filter(
      f => f.following_id && !blockedIdStrings.has(f.following_id._id.toString())
    );

    const followingWithCurrentUserFollowed = await Promise.all(
      visibleFollowing.map(async followedUser => {
        const currentUserFollowed = await Follow.exists({
          follower_id: currentUserId,
          following_id: followedUser.following_id._id,
        });
        return {
          following_id: followedUser.following_id,
          currentUserFollowed,
        };
      })
    );

    res.status(200).json({ following: followingWithCurrentUserFollowed });
  } catch (error) {
    console.error('Error retrieving following users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = getFollowing;
