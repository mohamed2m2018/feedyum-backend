const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const Like = mongoose.model('like');

const getStories = (req, res) => {
    const { page = 1, limit = 10, id } = req.query;
    const errors = {};
    Story.find({author: new mongoose.Types.ObjectId(id)})
        .limit(limit * 1)
        .skip((page - 1) * limit).sort({ _id: -1 })
        .exec().then(async (stories) => {
            // get total documents in the stories collection 
            const count = await Story.countDocuments({author: new mongoose.Types.ObjectId(id)});

            // Fetch currentUserLiked for each story
            const populatedStories = await Promise.all(
                stories.map(async (story) => {
                // Check if the current user has liked the story
                const currentUserLiked = await Like.exists({ post_id: id, user_id: req.user?._id });
        
                return {
                    ...story?._doc,
                    currentUserLiked
                };
                })
            );

            // return response with stories, total pages, and current page
            res.json({
                stories: populatedStories,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            });
        })
        .catch((err) => {
            errors.error = 'Error fetching stories from database';
            res.status(500).json({ ...errors, ...err });
        });
};

module.exports = getStories;
