const mongoose = require('mongoose');
const keys = require('../config/keys');

async function fixUserIdTypes() {
  try {
    console.log('🔧 Fixing user_id data types...\n');
    
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to foodtok database');
    
    const db = mongoose.connection.db;
    const dishesCollection = db.collection('dishes');
    
    // Get all dishes
    const allDishes = await dishesCollection.find({}).toArray();
    console.log(`📊 Found ${allDishes.length} dishes to check`);
    
    let fixedCount = 0;
    let alreadyObjectIdCount = 0;
    let errorCount = 0;
    
    for (const dish of allDishes) {
      try {
        // Check if user_id is already an ObjectId
        if (dish.user_id instanceof mongoose.Types.ObjectId) {
          alreadyObjectIdCount++;
          continue;
        }
        
        // If it's a string, convert to ObjectId
        if (typeof dish.user_id === 'string' && mongoose.Types.ObjectId.isValid(dish.user_id)) {
          await dishesCollection.updateOne(
            { _id: dish._id },
            { $set: { user_id: new mongoose.Types.ObjectId(dish.user_id) } }
          );
          fixedCount++;
          
          if (fixedCount % 10 === 0) {
            console.log(`   🔄 Fixed ${fixedCount} dishes...`);
          }
        } else {
          console.log(`   ⚠️  Invalid user_id for dish ${dish.name}: ${dish.user_id}`);
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error fixing dish ${dish.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} dishes`);
    console.log(`   ✓ Already ObjectId: ${alreadyObjectIdCount} dishes`);
    console.log(`   ❌ Errors: ${errorCount} dishes`);
    
    // Verify the fix
    console.log(`\n🧪 Verifying fix...`);
    
    // Test Alex Thompson specifically
    const alexId = '686c07e9643281d2101d66ec';
    const alexObjectId = new mongoose.Types.ObjectId(alexId);
    
    const alexDishesString = await dishesCollection.countDocuments({ user_id: alexId });
    const alexDishesObjectId = await dishesCollection.countDocuments({ user_id: alexObjectId });
    
    console.log(`   Alex Thompson dishes (string query): ${alexDishesString}`);
    console.log(`   Alex Thompson dishes (ObjectId query): ${alexDishesObjectId}`);
    
    if (alexDishesObjectId > 0) {
      console.log(`   ✅ Alex Thompson's dishes are now properly typed!`);
      
      // Show sample dishes
      const sampleDishes = await dishesCollection.find({ user_id: alexObjectId }).limit(3).toArray();
      console.log(`   📋 Sample dishes:`);
      sampleDishes.forEach(dish => {
        console.log(`      - ${dish.name} ($${dish.price})`);
      });
    }
    
    // Test all chefs
    console.log(`\n👨‍🍳 Testing all chefs after fix:`);
    const uniqueUserIds = await dishesCollection.distinct('user_id');
    
    for (const userId of uniqueUserIds.slice(0, 5)) {
      const dishCount = await dishesCollection.countDocuments({ user_id: userId });
      console.log(`   - ${userId} (${typeof userId}): ${dishCount} dishes`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

fixUserIdTypes();