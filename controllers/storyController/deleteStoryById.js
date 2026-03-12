const mongoose = require('mongoose');
const { deleteFromR2 } = require('../../utils/r2Client');

// Models
const Story = mongoose.model('story');
const User = mongoose.model('user');


const deleteStoryById = (req, res) => {
    const storyId = req.params.id;
    const userId = req.user._id;

    Story.findOneAndDelete({ _id: storyId, author: userId })
        .then(async (deletedStory) => {
            await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: -1 } });

            // Delete associated R2 media files
            if (deletedStory) {
                const deletions = [];
                if (deletedStory.uri) deletions.push(deleteFromR2(deletedStory.uri));
                if (deletedStory.poster) deletions.push(deleteFromR2(deletedStory.poster));

                if (deletions.length > 0) {
                    await Promise.allSettled(deletions);
                    console.log(`[deleteStory] Cleaned up ${deletions.length} R2 file(s) for story ${storyId}`);
                }
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
