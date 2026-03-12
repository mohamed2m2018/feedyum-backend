const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");

// Utils
const { getNearestBranch } = require('../../utils/getNearestBranch');

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

      let kmAway;
      if (req?.query?.lat && req?.query?.lat !== 'undefined' && story?.author?._id) {
        const branchData = await getNearestBranch(story.author._id, Number(req.query.lat), Number(req.query.long));
        kmAway = branchData?.distance;
      }

      res.json({
        story: {
          ...story?._doc,
          kmAway,
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
