const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");

// Utils
const { getNearestLocation } = require('../../utils/storyFeedUtils');

const getStoryById = (req, res) => {
  const errors = {};
  Story.findById(req.params.id)
    .populate("author")
    .populate("dishes")
    .then(async (story) => {
      const currentUserLiked = await Like.exists({
        post_id: req.params.id,
        user_id: req.user._id,
      });
      res.json({
        story: {
          ...story?._doc,
          kmAway: req?.query?.lat !== 'undefined' ? getNearestLocation(Number(req?.query?.lat), Number(req?.query?.long), story?.author?.locations)?.distance : undefined,
          currentUserLiked,
        },
        success: true,
      });
    })
    .catch((err) => {
      errors.error = "Error checking for the story in the database";
      res.status(500).json({ ...errors, ...err });
    });
};

module.exports = getStoryById;
