const mongoose = require('mongoose');
const cacheManager = require('../../utils/cacheManager');

// Models
const Story = mongoose.model('story');
const User = mongoose.model('user');


const deleteStoryById = (req, res) => {
    const storyId = req.params.id;
    const userId = req.user._id;

    Story.findOneAndDelete({ _id: storyId, author: userId })
        .then(async () => {
            await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: -1 } });

            // Invalidate User Stories Cache (Write-Through)
            try {
                // Invalidate all author feed pages for this user
                const deletedCount = await cacheManager.delPattern(`api:/api/story/author*:${userId}`);
                console.log(`🗑️ Invalidated ${deletedCount} cache keys for user stories ${userId}`);
            } catch (cacheErr) {
                console.warn('⚠️ Failed to invalidate story cache:', cacheErr.message);
            }

            res.json({
                message: 'Story deleted successfully'
            });
        })
        .catch((err) => {
            let errors = {};
            errors.error = 'Error deleting story from the database';
            res.status(500).json({ ...errors, ...err });
        });
};

module.exports = deleteStoryById;





