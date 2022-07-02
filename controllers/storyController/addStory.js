const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');


// Models
const Story = mongoose.model('story');

module.exports = addStory = (req, res) => {
    // Create new user
    const newStory = new Story({
        title: req.body?.title,
        description: req.body?.description,
        image: req.body?.image,
        stories: req.body?.stories,
    });
    newStory.save().then(story => res.json({ story, success: true })).catch((err) => {
        errors.error = 'Error saving user to database';
        res.status(500).json({ ...errors, ...err });
    });

};
