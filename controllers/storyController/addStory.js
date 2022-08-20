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
        title: req.body?.title,
        description: req.body?.description,
        image: req.body?.image,
        stories: req.body?.stories,
        author: req.user._id,
        price: req.body?.price,
        category: req.body.category,
    });
    newStory.save().then(story => res.json({ story, success: true })).catch((err) => {
        errors.error = 'Error saving user to database';
        res.status(500).json({ ...errors, ...err });
    });

};
