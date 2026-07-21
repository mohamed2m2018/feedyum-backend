const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    const db = mongoose.connection.db;
    console.log('Connected to:', process.env.MONGO_URI.split('@')[1].split('?')[0]);

    // Delete ALL users and ALL associated data
    const collections = [
      'users', 'dishes', 'menus', 'sections', 'chefbranches',
      'reels', 'stories', 'orders', 'notifications', 'follows',
      'likes', 'comments', 'carts', 'reviews', 'favorites'
    ];

    for (const col of collections) {
      const result = await db.collection(col).deleteMany({});
      console.log(`  Deleted ${result.deletedCount} from ${col}`);
    }

    // Verification
    console.log('\n=== FINAL STATE ===');
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      console.log(`  ${col}: ${count}`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
