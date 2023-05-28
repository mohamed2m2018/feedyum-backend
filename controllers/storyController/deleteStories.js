const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

const deleteStories = (req, res) => {
    Story.find().remove(()=> res.json({
      message: 'Items deleted succesfully'
    }))
       .catch((err) => {
            let errors = {};
            errors.error = 'Error deleting stories from database';
            res.status(500).json({ ...errors, ...err });
        });
};

module.exports = deleteStories;