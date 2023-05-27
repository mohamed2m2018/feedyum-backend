const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

const getStoryById = (req, res) => {
  const errors = {};
  Story.findById(req.params.id).populate('author')
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

module.exports = getStoryById;
