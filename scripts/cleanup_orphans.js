const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const KEEP_EMAILS = [
  'dinaabdelmoneam605@gmail.com',
  'gambarimama@feedyum.com'
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    const db = mongoose.connection.db;
    console.log('Connected to:', process.env.MONGO_URI.split('@')[1].split('?')[0]);

    // Get valid user IDs (the 2 keepers)
    const users = await db.collection('users').find({}).toArray();
    const validIds = users.map(u => u._id);
    console.log('\nKept users (' + users.length + '):');
    users.forEach(u => console.log('  ✅ ' + u.fullName + ' (' + u.email + ')'));

    // Find and delete orphaned dishes (owner not in valid IDs)
    const orphanedDishes = await db.collection('dishes').deleteMany({ owner: { $nin: validIds } });
    console.log('\nDeleted ' + orphanedDishes.deletedCount + ' orphaned dishes');

    const orphanedMenus = await db.collection('menus').deleteMany({
      $and: [
        { owner: { $nin: validIds } },
        { chef: { $nin: validIds } }
      ]
    });
    console.log('Deleted ' + orphanedMenus.deletedCount + ' orphaned menus');

    const orphanedSections = await db.collection('sections').deleteMany({ owner: { $nin: validIds } });
    console.log('Deleted ' + orphanedSections.deletedCount + ' orphaned sections');

    const orphanedBranches = await db.collection('chefbranches').deleteMany({ chef: { $nin: validIds } });
    console.log('Deleted ' + orphanedBranches.deletedCount + ' orphaned branches');

    const orphanedStories = await db.collection('stories').deleteMany({ chef: { $nin: validIds } });
    console.log('Deleted ' + orphanedStories.deletedCount + ' orphaned stories');

    const orphanedReels = await db.collection('reels').deleteMany({ chef: { $nin: validIds } });
    console.log('Deleted ' + orphanedReels.deletedCount + ' orphaned reels');

    // Final counts
    console.log('\n=== FINAL STATE ===');
    const collections = ['users', 'dishes', 'menus', 'sections', 'chefbranches', 'stories', 'reels', 'orders', 'notifications'];
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      console.log('  ' + col + ': ' + count);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
