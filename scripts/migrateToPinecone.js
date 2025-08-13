#!/usr/bin/env node

/**
 * Migration script to move existing embeddings from MongoDB to Pinecone
 * Usage: node scripts/migrateToPinecone.js [--type=dishes|users|stories|all]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const pineconeDataMigration = require('../services/pineconeDataMigration');

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => arg.startsWith('--type='));
  const migrationType = typeArg ? typeArg.split('=')[1] : 'all';

  console.log('🚀 Starting Pinecone migration...');
  console.log(`📋 Migration type: ${migrationType}`);

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('❌ PINECONE_API_KEY environment variable is required');
    }

    console.log('🔧 Environment check passed');

    // Run migration based on type
    let results;
    switch (migrationType) {
      case 'dishes':
        results = await pineconeDataMigration.migrateDishes();
        break;
      case 'users':
        results = await pineconeDataMigration.migrateUsers();
        break;
      case 'stories':
        results = await pineconeDataMigration.migrateStories();
        break;
      case 'all':
      default:
        results = await pineconeDataMigration.migrateAll();
        break;
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Results:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Migration interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Migration terminated');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the migration
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});