const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Like = mongoose.model('like');
const Follow = mongoose.model('follow');

const getFollowingStories = async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const errors = {};
  
  try {
    const currentUserFollowing = await Follow.find({ follower_id: userId }, 'following_id');

    // Retrieve stories of the users the current user is following
    const followingStories = await Story.find({ author: { $in: currentUserFollowing.map(follow => follow.following_id) } })
      .limit(limit * 1)
      .populate('author')
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .exec();

    if (followingStories.length === 0) {
      errors.nostories = 'No stories found';
      return res.status(404).json(errors);
    }

    // Fetch currentUserLiked for each story
    const populatedStories = await Promise.all(
      followingStories.map(async (story) => {
        // Check if the current user has liked the story
        const currentUserLiked = await Like.exists({ post_id: story._doc._id, user_id: userId });

        return {
          ... story?._doc,
          currentUserLiked
        };
      })
    );

    // Return response with stories, total pages, and current page
    res.json({
      stories: populatedStories,
      totalPages: Math.ceil(followingStories.length / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching following stories:', error);
    errors.error = 'Error fetching following stories';
    res.status(500).json({ ...errors, ...error });
  }
};


module.exports = getFollowingStories;