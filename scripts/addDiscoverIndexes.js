const mongoose = require('mongoose');
require('dotenv').config();

async function addDiscoverIndexes() {
  try {
    console.log('🚀 Adding performance indexes for Discover screen...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/makeit', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Users collection indexes
    console.log('📊 Adding User indexes...');
    await db.collection('users').createIndex({ tags: 1, type: 1, date: -1 });
    await db.collection('users').createIndex({ type: 1, tags: 1 });
    await db.collection('users').createIndex({ 'locations.lat': 1, 'locations.long': 1 });
    console.log('✅ User indexes added');
    
    // Dishes collection indexes
    console.log('📊 Adding Dish indexes...');
    await db.collection('dishes').createIndex({ category: 1, available: 1, date: -1 });
    await db.collection('dishes').createIndex({ chef: 1, category: 1, available: 1 });
    await db.collection('dishes').createIndex({ 'branch.lat': 1, 'branch.long': 1 });
    await db.collection('dishes').createIndex({ available: 1, date: -1 });
    console.log('✅ Dish indexes added');
    
    // Ratings collection indexes
    console.log('📊 Adding Rating indexes...');
    await db.collection('ratings').createIndex({ user_id: 1, average_rating: -1 });
    await db.collection('ratings').createIndex({ average_rating: -1, total_ratings: -1 });
    console.log('✅ Rating indexes added');
    
    console.log('🎉 All Discover performance indexes added successfully!');
    
    // Show current indexes
    console.log('\n📋 Current indexes:');
    const userIndexes = await db.collection('users').indexes();
    const dishIndexes = await db.collection('dishes').indexes();
    const ratingIndexes = await db.collection('ratings').indexes();
    
    console.log('Users:', userIndexes.map(idx => idx.name));
    console.log('Dishes:', dishIndexes.map(idx => idx.name));
    console.log('Ratings:', ratingIndexes.map(idx => idx.name));
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
addDiscoverIndexes().catch(console.error);