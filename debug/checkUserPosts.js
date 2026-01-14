const mongoose = require('mongoose');
const keys = require('../config/keys');
require('../models/User');
require('../models/Story');
require('../models/Dish');
require('../models/Menu');
require('../models/Category');

const User = mongoose.model('user');
const Story = mongoose.model('story');

const checkUserPosts = async () => {
    try {
        await mongoose.connect(keys.mongoURI);
        console.log('MongoDB Connected');

        const email = 'mohamed2m2018@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Found user: ${user.name} (${user._id})`);

        const stories = await Story.find({ author: user._id })
            .sort({ created_at: -1 })
            .limit(5)
            .lean();

        console.log(`Found ${stories.length} recent stories:`);
        stories.forEach((story, index) => {
            console.log(`\n--- Story ${index + 1} ---`);
            console.log(`ID: ${story._id}`);
            console.log(`Created At: ${story.created_at}`);
            console.log(`Type: ${story.isReview ? 'Review' : 'Regular'}`);
            console.log(`URI: ${story.uri}`);
            console.log(`Avatar URI: ${story.avatarUri}`);
            console.log(`Poster: ${story.poster}`);
            console.log(`Title: ${story.title}`);
            console.log(`Caption: ${story.caption}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

checkUserPosts();
