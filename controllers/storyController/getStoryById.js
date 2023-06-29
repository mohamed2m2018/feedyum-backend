const mongoose = require("mongoose");

// Models
const Story = mongoose.model("story");
const Like = mongoose.model("like");

const getStoryById = (req, res) => {
  const errors = {};
  const { userId } = req.query;
  Story.findById(req.params.id)
    .populate("author")
    .then(async (story) => {
      const currentUserLiked = await Like.exists({
        post_id: req.params.id,
        user_id: userId,
      });
      res.json({
        story :{...story?._doc,
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
