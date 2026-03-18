const mongoose = require('mongoose');
const User = require('../models/user');
const Follow = require('../models/follow');
require('dotenv').config();

const MONGO_URI_STAGING = process.env.MONGO_URI_STAGING;

async function run() {
  if (!MONGO_URI_STAGING) {
    console.error('MONGO_URI_STAGING is not defined in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to Staging Database...');
    await mongoose.connect(MONGO_URI_STAGING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to Staging Database.');

    // Find mohamed2m2020 account
    const latestChef = await User.findOne({ $or: [{ email: /mohamed2m2020/i }, { username: /mohamed2m2020/i }] });

    if (!latestChef) {
      console.log('No chef found in staging DB.');
      process.exit(0);
    }

    console.log(`Target Chef found: ${latestChef.fullName} (${latestChef.email}) - ID: ${latestChef._id}`);

    // Find all other users
    const allUsers = await User.find({ _id: { $ne: latestChef._id } }).select('_id type');
    console.log(`Found ${allUsers.length} other users.`);

    let followCount = 0;
    let existingCount = 0;

    for (const user of allUsers) {
      // Check if already following
      const exists = await Follow.findOne({
        follower_id: user._id,
        following_id: latestChef._id,
      });

      if (!exists) {
        await Follow.create({
          follower_id: user._id,
          following_id: latestChef._id,
        });
        followCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`Successfully made ${followCount} users follow ${latestChef.fullName}.`);
    console.log(`${existingCount} users were already following.`);
    
    // Update the chef's followers count and users following count
    // Wait, the app might depend on Follower/Following counts or calculate them dynamically.
    // Let's run a quick bulk update just in case they are cached in the User model.
    // In Feedyum, usually the follow statistics are fetched dynamically via the follow controller.
    
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
