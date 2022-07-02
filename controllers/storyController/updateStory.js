const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

// Validations
const validateStory = require('../../validations/EditStory');

module.exports = updateStory = (req, res) => {
    // Validate
    const { errors, isValid } = validateStory(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }
    const newStoryDetails = {
        ...req?.body
    };


    Story.findOneAndUpdate(
        { $and: [{ _id: req.body.id }, { author: req.user._id }] },
        { $set: newStoryDetails },
        { new: true }
    )
        .then((story) => {
            errors.id = 'Story does not exist, or you are not the author';
            if(!story) return res.status(404).json(errors);
            return res.json({
                story,
                success: true
            });
        }
        )
        .catch((err) => {
            errors.id = 'Error checking for the story in the database';
            res.status(500).json({ ...errors, ...err });
        });
};
