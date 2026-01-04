const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

// Services
const cacheManager = require('../../utils/cacheManager');

// Validations
const validateStory = require('../../validations/EditStory');

const updateStory = (req, res) => {
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
        .then(async (story) => {
            // Invalidate User Stories Cache (Write-Through)
            try {
                const userId = req.user._id.toString();
                const deletedCount = await cacheManager.delPattern(`api:/api/story/author*:${userId}`);
                console.log(`🗑️ Invalidated ${deletedCount} cache keys for user stories ${userId}`);
            } catch (cacheErr) {
                console.warn('⚠️ Failed to invalidate story cache:', cacheErr.message);
            }
            errors.id = 'Post does not exist, or you are not the author';
            if (!story) return res.status(404).json(errors);
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

module.exports = updateStory;
