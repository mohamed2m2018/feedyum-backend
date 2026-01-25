#!/usr/bin/env node
/**
 * Sync MongoDB Indexes
 * 
 * Run this script after deploying to ensure all indexes are created:
 * node scripts/syncIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function syncIndexes() {
    console.log('🔄 Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import all models to ensure schemas are registered
    require('../models/story');
    require('../models/user');
    require('../models/views');
    require('../models/like');
    require('../models/follow');
    require('../models/dish');

    console.log('🔄 Syncing indexes...');

    const models = mongoose.modelNames();

    for (const modelName of models) {
        try {
            const model = mongoose.model(modelName);
            await model.syncIndexes();

            // List indexes
            const indexes = await model.collection.indexes();
            console.log(`✅ ${modelName}: ${indexes.length} indexes`);
            indexes.forEach(idx => {
                const keys = Object.keys(idx.key).join(', ');
                console.log(`   - ${idx.name}: { ${keys} }`);
            });
        } catch (err) {
            console.error(`❌ ${modelName}: ${err.message}`);
        }
    }

    console.log('\n✅ Index sync complete!');
    process.exit(0);
}

syncIndexes().catch(err => {
    console.error('❌ Failed to sync indexes:', err);
    process.exit(1);
});
