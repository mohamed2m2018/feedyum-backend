/**
 * Delete ALL dishes from production database and their R2 images
 * 
 * Usage: NODE_ENV=production node scripts/deleteAllProdDishes.js
 * 
 * This script:
 * 1. Connects to the production MongoDB
 * 2. Fetches all dishes with their image URLs
 * 3. Deletes each dish image from Cloudflare R2
 * 4. Deletes all dish documents from MongoDB
 * 5. Cleans up menu references (removes deleted dish IDs from menus)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const keys = require('../config/keys');
const Dish = require('../models/dish');
const Menu = require('../models/menu');
const { deleteFromR2 } = require('../utils/r2Client');

async function deleteAllDishes() {
  console.log('========================================');
  console.log('⚠️  DELETE ALL PRODUCTION DISHES');
  console.log('========================================\n');

  // 1. Connect to MongoDB
  const mongoURI = keys.mongoURI;
  if (!mongoURI) {
    console.error('❌ MONGO_URI is not set. Aborting.');
    process.exit(1);
  }
  console.log(`📡 Connecting to MongoDB...`);
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB\n');

  // 2. Fetch all dishes
  const dishes = await Dish.find({}, '_id name image');
  console.log(`📋 Found ${dishes.length} dishes to delete\n`);

  if (dishes.length === 0) {
    console.log('ℹ️  No dishes found. Nothing to delete.');
    await mongoose.connection.close();
    return;
  }

  // 3. Delete R2 images
  const dishesWithImages = dishes.filter(d => d.image && d.image.startsWith('http'));
  console.log(`🖼️  ${dishesWithImages.length} dishes have R2 images to delete\n`);

  let r2Deleted = 0;
  let r2Failed = 0;
  for (const dish of dishesWithImages) {
    try {
      const success = await deleteFromR2(dish.image);
      if (success) {
        r2Deleted++;
        console.log(`  ✅ R2 deleted: ${dish.name} -> ${dish.image}`);
      } else {
        r2Failed++;
        console.log(`  ⚠️ R2 skip/fail: ${dish.name} -> ${dish.image}`);
      }
    } catch (err) {
      r2Failed++;
      console.error(`  ❌ R2 error for ${dish.name}: ${err.message}`);
    }
  }
  console.log(`\n🖼️  R2 Summary: ${r2Deleted} deleted, ${r2Failed} failed/skipped\n`);

  // 4. Delete all dish documents from MongoDB
  const deleteResult = await Dish.deleteMany({});
  console.log(`🗑️  Deleted ${deleteResult.deletedCount} dish documents from MongoDB\n`);

  // 5. Clean up menu references
  const menuUpdateResult = await Menu.updateMany({}, { $set: { dishes: [] } });
  console.log(`🧹 Cleaned dish references from ${menuUpdateResult.modifiedCount} menus\n`);

  // 6. Summary
  console.log('========================================');
  console.log('✅ DONE — All dishes deleted');
  console.log(`   📋 Dishes removed: ${deleteResult.deletedCount}`);
  console.log(`   🖼️  R2 images deleted: ${r2Deleted}`);
  console.log(`   🧹 Menus cleaned: ${menuUpdateResult.modifiedCount}`);
  console.log('========================================');

  await mongoose.connection.close();
  console.log('📡 Database connection closed.');
}

deleteAllDishes().catch(err => {
  console.error('❌ Fatal error:', err);
  mongoose.connection.close();
  process.exit(1);
});
