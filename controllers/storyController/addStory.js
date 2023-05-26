const mongoose = require('mongoose');
// Validations
const validateStory = require('../../validations/AddStory');


// Models
const Story = mongoose.model('story');


module.exports = addStory = (req, res) => {

    // Validate
    const { errors, isValid } = validateStory(req.body);
    if (!isValid) {
        return res.status(400).json(errors);
    }

    // Create new story
    const newStory = new Story({
        caption: req.body?.caption,
        uri: req.body?.uri,
        author: req.user._id,
        price: req.body?.price,
        avatarUri: req.body?.avatarUri,
        category: req.body.category,
        title: req.body?.title,
        phone: req.body?.phone,
    });
    newStory.save().then(story => res.json({ story, success: true })).catch((err) => {
        errors.error = 'Error saving user to database';
        res.status(500).json({ ...errors, ...err });
    });

};
