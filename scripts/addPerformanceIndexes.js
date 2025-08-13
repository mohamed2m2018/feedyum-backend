// Add database indexes for optimal query performance
const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

async function addPerformanceIndexes() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔗 Connected to MongoDB');
    console.log('📊 Adding performance indexes...');
    
    const db = mongoose.connection.db;
    
    // Story collection indexes
    await db.collection('stories').createIndex({ author: 1, created_at: -1 });
    await db.collection('stories').createIndex({ category: 1, created_at: -1 });
    await db.collection('stories').createIndex({ created_at: -1 });
    console.log('✅ Story indexes added');
    
    // User collection indexes
    await db.collection('users').createIndex({ type: 1, 'locations.lat': 1, 'locations.long': 1 });
    await db.collection('users').createIndex({ tags: 1, type: 1 });
    await db.collection('users').createIndex({ fullName: 'text', bio: 'text' });
    console.log('✅ User indexes added');
    
    // Dish collection indexes
    await db.collection('dishes').createIndex({ chef: 1, available: 1 });
    await db.collection('dishes').createIndex({ category: 1, available: 1 });
    await db.collection('dishes').createIndex({ 'branch.lat': 1, 'branch.long': 1 });
    console.log('✅ Dish indexes added');
    
    // Rating collection indexes
    await db.collection('ratings').createIndex({ user_id: 1, average_rating: 1 });
    await db.collection('ratings').createIndex({ average_rating: -1 });
    console.log('✅ Rating indexes added');
    
    // Like collection indexes
    await db.collection('likes').createIndex({ post_id: 1, user_id: 1 });
    await db.collection('likes').createIndex({ user_id: 1 });
    console.log('✅ Like indexes added');
    
    console.log('🚀 All performance indexes added successfully!');
    console.log('📈 Database queries should now be significantly faster');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
}

addPerformanceIndexes();