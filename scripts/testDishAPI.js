const mongoose = require('mongoose');
const keys = require('../config/keys');

// Import models
require('../models/loadModels');
const Dish = require('../models/dish');

async function testDishAPI() {
  try {
    console.log('🧪 Testing Dish API functionality...\n');
    
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to foodtok database');
    
    // Test Alex Thompson's dishes
    const alexId = '686c07e9643281d2101d66ec';
    console.log(`\n🔍 Testing dishes for Alex Thompson (${alexId}):`);
    
    // Test the exact query that getDishesByChef will use
    const alexDishes = await Dish.find({ user_id: alexId }).populate('section');
    console.log(`   ✅ Found ${alexDishes.length} dishes`);
    
    if (alexDishes.length > 0) {
      console.log('   📋 Sample dishes:');
      alexDishes.slice(0, 3).forEach(dish => {
        console.log(`      - ${dish.name} ($${dish.price}) - Visible: ${dish.visible}`);
      });
    }
    
    // Test a specific dish
    if (alexDishes.length > 0) {
      const testDish = alexDishes[0];
      console.log(`\n🍽️  Testing dish details for: ${testDish.name}`);
      
      const dishDetails = await Dish.findById(testDish._id).populate('menu');
      console.log(`   ✅ Dish found: ${dishDetails.name}`);
      console.log(`   👨‍🍳 Chef ID: ${dishDetails.user_id}`);
      console.log(`   📋 Menu: ${dishDetails.menu?.name || 'No menu'}`);
      console.log(`   👁️  Visible: ${dishDetails.visible}`);
    }
    
    // Test all chefs
    console.log(`\n👨‍🍳 Testing all chefs with dishes:`);
    const allDishes = await Dish.find({});
    const chefDishCounts = {};
    
    allDishes.forEach(dish => {
      const chefId = dish.user_id.toString();
      chefDishCounts[chefId] = (chefDishCounts[chefId] || 0) + 1;
    });
    
    const User = require('../models/user');
    for (const [chefId, count] of Object.entries(chefDishCounts)) {
      const chef = await User.findById(chefId);
      console.log(`   - ${chef?.fullName || 'Unknown'}: ${count} dishes`);
    }
    
    console.log(`\n🎉 API test completed successfully!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

testDishAPI();