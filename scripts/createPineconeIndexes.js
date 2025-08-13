#!/usr/bin/env node

/**
 * Script to create Pinecone indexes for semantic search
 * Usage: node scripts/createPineconeIndexes.js
 */

require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

const EMBEDDING_DIMENSION = 384; // For multilingual-e5-small model

const indexConfigs = {
  'dishes-index': {
    name: process.env.PINECONE_DISHES_INDEX || 'dishes-index',
    dimension: EMBEDDING_DIMENSION,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  },
  'users-index': {
    name: process.env.PINECONE_USERS_INDEX || 'users-index',
    dimension: EMBEDDING_DIMENSION,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  },
  'stories-index': {
    name: process.env.PINECONE_STORIES_INDEX || 'stories-index',
    dimension: EMBEDDING_DIMENSION,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1'
      }
    }
  }
};

async function createIndexes() {
  try {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }

    console.log('🚀 Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Get existing indexes
    console.log('📋 Checking existing indexes...');
    const existingIndexes = await pinecone.listIndexes();
    const existingIndexNames = existingIndexes.indexes?.map(idx => idx.name) || [];

    console.log('📊 Existing indexes:', existingIndexNames);

    // Create indexes that don't exist
    for (const [key, config] of Object.entries(indexConfigs)) {
      if (existingIndexNames.includes(config.name)) {
        console.log(`✅ Index "${config.name}" already exists, skipping...`);
        continue;
      }

      console.log(`🔨 Creating index "${config.name}"...`);
      console.log(`   Dimension: ${config.dimension}`);
      console.log(`   Metric: ${config.metric}`);
      console.log(`   Spec: ${JSON.stringify(config.spec, null, 2)}`);

      await pinecone.createIndex({
        name: config.name,
        dimension: config.dimension,
        metric: config.metric,
        spec: config.spec
      });

      console.log(`✅ Index "${config.name}" created successfully!`);
      
      // Wait a bit between creations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🎉 All indexes created successfully!');
    
    // List final indexes
    console.log('📋 Final index list:');
    const finalIndexes = await pinecone.listIndexes();
    finalIndexes.indexes?.forEach(idx => {
      console.log(`   - ${idx.name} (${idx.dimension}D, ${idx.metric})`);
    });

  } catch (error) {
    console.error('❌ Failed to create indexes:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Some indexes may already exist, which is normal.');
    } else {
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Index creation interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Index creation terminated');
  process.exit(0);
});

// Run the script
createIndexes().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});