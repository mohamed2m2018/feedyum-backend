/**
 * Database Cleanup Script
 * This script will delete ALL data from every collection in the database.
 * USE WITH CAUTION - This is irreversible!
 */

const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

// Import all models to ensure they're registered
require('../models/loadModels');

async function clearDatabase() {
    console.log('🔌 Connecting to MongoDB...');

    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');
        console.log('⚠️  WARNING: Clearing ALL data from the database...\n');

        // Get all collection names
        const collections = await mongoose.connection.db.listCollections().toArray();

        console.log(`Found ${collections.length} collections to clear:\n`);

        // Delete all documents from each collection
        for (const collection of collections) {
            const collectionName = collection.name;

            try {
                const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
                console.log(`  ✅ ${collectionName}: Deleted ${result.deletedCount} documents`);
            } catch (err) {
                console.log(`  ❌ ${collectionName}: Error - ${err.message}`);
            }
        }

        console.log('\n🎉 Database cleanup complete!');
        console.log('📊 All collections are now empty.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
        process.exit(0);
    }
}

// Run the script
clearDatabase();
