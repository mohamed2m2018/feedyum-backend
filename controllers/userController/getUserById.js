const User = require('../../models/user');
const Follow = require('../../models/follow');

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    // Get current user ID from token if available
    const currentUserId = req.user?._id;

    const user = await User.findById(id).select('fullName username avatar email phone type bio locations').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user follows this user
    let currentUserFollowed = false;
    if (currentUserId && currentUserId.toString() !== id) {
      const followExists = await Follow.exists({
        follower_id: currentUserId,
        following_id: id
      });
      currentUserFollowed = !!followExists;
    }

    res.status(200).json({
      success: true,
      user,
      // Include follow status at top level for easy access
      currentUserFollowed
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

module.exports = getUserById;