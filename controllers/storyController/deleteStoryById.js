const mongoose = require('mongoose');


// Models
const Story = mongoose.model('story');
const User = mongoose.model('user');


const deleteStoryById = (req, res) => {
    const storyId = req.params.id;
    const userId = req.user._id;

    Story.findOneAndDelete({ _id: storyId, author: userId })
        .then(async () => {
            await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: -1 } });

            // Cache removed

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





