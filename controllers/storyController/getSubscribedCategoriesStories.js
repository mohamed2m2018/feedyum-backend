const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Like = mongoose.model('like');
const User = mongoose.model('user');

const getCategoryStories = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const errors = {};

  try {
    const currentUser = req.user; // Assuming the authenticated user is stored in the `req.user` object

    // Retrieve stories based on the categories selected in the user's profile
    const user = await User.findById(currentUser._id).populate('categories');
    const categoryIds = user.categories.map(category => category._id);

    // Construct the query to retrieve stories with any of the selected categories
    const categoryStories = await Story.find({ category: { $in: categoryIds } })
      .limit(limit * 1)
      .populate('author')
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .exec();

    if (categoryStories.length === 0) {
      errors.nostories = 'No stories found';
      return res.status(404).json(errors);
    }

    // Fetch currentUserLiked for each story
    const populatedStories = await Promise.all(
      categoryStories.map(async (story) => {
        // Check if the current user has liked the story
        const currentUserLiked = await Like.exists({ post_id: story._id, user_id: currentUser._id });

        return {
          ...story?._doc,
          currentUserLiked
        };
      })
    );

    // Return response with stories, total pages, and current page
    res.json({
      stories: populatedStories,
      totalPages: Math.ceil(categoryStories.length / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching category stories:', error);
    errors.error = 'Error fetching category stories';
    res.status(500).json({ ...errors, ...error });
  }
};

module.exports = getCategoryStories;