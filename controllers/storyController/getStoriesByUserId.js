const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');

module.exports = getStories = (req, res) => {
    const { page = 1, limit = 10, id } = req.query;
    const errors = {};
    Story.find({author: new mongoose.Types.ObjectId(id)})
        .limit(limit * 1)
        .skip((page - 1) * limit).sort({ _id: -1 })
        .exec().then(async (stories) => {
            if (stories.length === 0) {
                errors.noStories = 'No stories found';
                return res.status(404).json(errors);
            }
            // get total documents in the stories collection 
            const count = await Story.countDocuments({author: new mongoose.Types.ObjectId(id)});

            // return response with stories, total pages, and current page
            res.json({
                stories,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            });
        })
        .catch((err) => {
            errors.error = 'Error fetching stories from database';
            res.status(500).json({ ...errors, ...err });
        });
};
