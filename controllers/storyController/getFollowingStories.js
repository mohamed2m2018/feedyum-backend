const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");
const Follow = mongoose.model("follow");
const View = mongoose.model("view");

const getFollowingStories = async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const errors = {};

  try {
    const currentUserFollowing = await Follow.find(
      { follower_id: userId },
      "following_id"
    );

    // Retrieve the count of stories of the users the current user is following
    const totalStories = await Story.countDocuments({
      author: {
        $in: currentUserFollowing.map((follow) => follow.following_id),
      },
    });

    // Retrieve paginated stories of the users the current user is following
    const followingStories = await Story.find({
      author: {
        $in: currentUserFollowing.map((follow) => follow.following_id),
      },
    })
      .limit(limit * 1)
      .populate("author")
      .skip((page - 1) * limit)
      .sort({ _id: -1 })
      .exec();

    if (followingStories.length === 0) {
      return res.json({
        stories: [],
        totalPages: 1,
        currentPage: page,
      });
    }



    // Return response with stories, total pages, and current page
    return res.json({
      stories: followingStories,
      totalPages: Math.ceil(totalStories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching following stories:", error);
    errors.error = "Error fetching following stories";
    return res.status(500).json({ ...errors, ...error });
  }
};

module.exports = getFollowingStories;
