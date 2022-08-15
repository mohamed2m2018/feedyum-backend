const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

module.exports = deleteStories = (req, res) => {
    Story.find().remove(()=> res.json({
      message: 'Items deleted succesfully'
    }))
       .catch((err) => {
            errors.error = 'Error deleting stories from database';
            res.status(500).json({ ...errors, ...err });
        });
};
