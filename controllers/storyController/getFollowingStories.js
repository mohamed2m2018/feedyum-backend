const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");
const Follow = mongoose.model("follow");
const View = mongoose.model("view");

// Fisher-Yates Shuffle Function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const getFollowingStories = async (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const errors = {};

  try {
    const currentUserFollowing = await Follow.find(
      { follower_id: userId },
      "following_id"
    );

    // Retrieve all stories of the users the current user is following
    const allFollowingStories = await Story.find({
      author: {
        $in: currentUserFollowing.map((follow) => follow.following_id),
      },
    })
      .populate("author")
      .sort({ _id: -1 })
      .exec();

    if (allFollowingStories.length === 0) {
      return res.json({
        stories: [],
        totalPages: 1,
        currentPage: page,
      });
    }

    // Shuffle the stories order randomly
    shuffleArray(allFollowingStories);

    // Calculate pagination offsets
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get the stories for the current page
    const followingStories = allFollowingStories.slice(startIndex, endIndex);

    // Return response with randomly ordered stories, total pages, and current page
    return res.json({
      stories: followingStories,
      totalPages: Math.ceil(allFollowingStories.length / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching following stories:", error);
    errors.error = "Error fetching following stories";
    return res.status(500).json({ ...errors, ...error });
  }
};

module.exports = getFollowingStories;
