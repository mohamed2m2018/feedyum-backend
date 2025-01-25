const mongoose = require('mongoose');
// Validations
const validateStory = require('../../validations/AddStory');


// Models
const Story = mongoose.model('story');

const User = mongoose.model('user');


const addStory = async (req, res) => {

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
        category: [...req.body.category],
        title: req.body?.title,
        phone: req.body?.phone,
        duration: req.body?.duration,
        governorate: req.body?.governorate,
        areas: req.body?.areas,
        poster: req.body?.poster,
        linkToGo: req.body?.linkToGo,
        reviewMode: req.body?.reviewMode,
        dishes: req.body?.dishes,
        allowContact: req.body?.allowContact,
    });
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: 1 } });

    newStory.save().then(story =>{        
        return res.json({ story, success: true })}).catch((err) => {
        errors.error = 'Error saving user to database';
        res.status(500).json({ ...errors, ...err });
    });

};

module.exports = addStory;
