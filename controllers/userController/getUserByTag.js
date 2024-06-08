const mongoose = require('mongoose');

// Models
const User = mongoose.model('user');
const Tag = mongoose.model('tag');
const Story = mongoose.model('story');
const Category = mongoose.model('category');

const getUserByTag = async (req, res) => {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Assuming you want to fetch 5 users per page

    try {
        const skip = (page - 1) * limit;

        // Fetch the tag and ensure it exists
        const fetchedTag = await Tag.findOne({ name: tag }).lean().exec();
        if (!fetchedTag) {
            return res.status(404).json({ success: false, error: 'Tag not found' });
        }

        // Fetch the corresponding category
        const category = await Category.findOne({ name: tag }).lean().exec();
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Find users with the fetched tag ID and paginate the results
        const users = await User.find({ tags: fetchedTag._id })
                                .skip(skip)
                                .limit(limit)
                                .lean()
                                .sort({_id:-1})
                                .exec();
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'No users found with the specified tag' });
        }

        // Fetch stories for each user that match the category and attach them to the user object
        for (let user of users) {
            const userStories = await Story.find({ author: user._id })
                                           .populate('category', 'name') // Assuming the category schema has a 'name' field
                                           .lean()
                                           .exec();
            user.stories = userStories; // Attach stories to the user object
        }

        const totalUsers = await User.countDocuments({ tags: fetchedTag._id });

        res.json({
            users,
            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            success: true
        });
    } catch (err) {
        console.error('error', err);
        res.status(500).json({ success: false, error: 'Error fetching users by tag' });
    }
};

module.exports = getUserByTag;
