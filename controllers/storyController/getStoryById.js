const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

module.exports = getStoryById = (req, res) => {
  const errors = {};
  Story.findById(req.params.id)
    .then((story) => {
      res.json({
        story,
        success: true,
      });
    })
    .catch((err) => {
      errors.error = 'Error checking for the story in the database';
      res.status(500).json({ ...errors, ...err });
    });
};
