const mongoose = require('mongoose');
const keys = require('../config/keys');
require('../models/User');
require('../models/Story');
require('../models/Dish');
require('../models/Menu');
require('../models/Category');

const User = mongoose.model('user');
const Story = mongoose.model('story');

const cleanupBadPosts = async () => {
    try {
        await mongoose.connect(keys.mongoURI);
        console.log('MongoDB Connected');

        const email = 'mohamed2m2018@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Checking posts for user: ${user.name} (${user._id})`);

        // Find posts with missing or empty URI
        const query = {
            author: user._id,
            $or: [
                { uri: { $exists: false } },
                { uri: null },
                { uri: '' }
            ]
        };

        const badStories = await Story.find(query);
        console.log(`Found ${badStories.length} corrupted stories (missing URI).`);

        if (badStories.length > 0) {
            const result = await Story.deleteMany(query);
            console.log(`Deleted ${result.deletedCount} corrupted stories.`);

            // Update user post count
            await User.findByIdAndUpdate(user._id, { $inc: { postsNo: -result.deletedCount } });
            console.log('Updated user post count.');
        } else {
            console.log('No corrupted stories found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

cleanupBadPosts();
