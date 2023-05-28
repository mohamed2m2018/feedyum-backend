const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");

const getReviewsStories = (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const errors = {};
  Story.find()
    .limit(limit * 1)
    .populate({
      path: "author",
      match: { type: "user" },
    })
    .skip((page - 1) * limit)
    .sort({ _id: -1 })
    .exec()
    .then(async (stories) => {
      if (stories.length === 0) {
        errors.nousers = "No Posts found";
        return res.status(404).json(errors);
      }
      // get total documents in the stories collection
      const count = await Story.countDocuments();

      // Fetch currentUserLiked for each story
      const populatedStories = await Promise.all(
        stories.map(async (story) => {
          // Check if the current user has liked the story
          const currentUserLiked = await Like.exists({
            post_id: story._id,
            user_id: userId,
          });

          return {
            ...story?._doc,
            currentUserLiked: currentUserLiked ? true : false,
          };
        })
      );

      // return response with stories, total pages, and current page
      res.json({
        stories: populatedStories,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    })
    .catch((err) => {
      errors.error = "Error fetching stories from database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = getReviewsStories;
