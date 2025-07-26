#!/usr/bin/env node

const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');

// Load all models
require('../models/loadModels');

const mongoURI = require('../config/keys').mongoURI;

async function checkExistingData() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📱 Connected to MongoDB');

    // Check users
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ type: { $ne: 'chef' } });
    const chefs = await User.countDocuments({ type: 'chef' });

    console.log('\n👥 Users:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   Customers: ${customers}`);
    console.log(`   Chefs: ${chefs}`);

    // Check menus and dishes
    const totalMenus = await Menu.countDocuments();
    const totalDishes = await Dish.countDocuments();

    console.log('\n🍽️ Menus & Dishes:');
    console.log(`   Menus: ${totalMenus}`);
    console.log(`   Dishes: ${totalDishes}`);

    // Get some sample user data
    if (totalUsers > 0) {
      console.log('\n📋 Sample Users:');
      const sampleUsers = await User.find({}).limit(5).select('fullName username type email');
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.fullName || user.username} (${user.type || 'customer'}) - ${user.email}`);
      });
    }

    // Get chef menu details
    if (chefs > 0) {
      console.log('\n👨‍🍳 Chef Menu Details:');
      const chefsWithMenus = await User.find({ type: 'chef' }).limit(3);
      
      for (const chef of chefsWithMenus) {
        const menu = await Menu.findOne({ chef: chef._id });
        if (menu) {
          const dishCount = await Dish.countDocuments({ menu: menu._id });
          console.log(`   ${chef.fullName || chef.username}: ${dishCount} dishes`);
        } else {
          console.log(`   ${chef.fullName || chef.username}: No menu`);
        }
      }
    }

    if (customers === 0 || chefs === 0) {
      console.log('\n⚠️  Missing Required Data:');
      if (customers === 0) console.log('   - No customer users found');
      if (chefs === 0) console.log('   - No chef users found');
      if (totalDishes === 0) console.log('   - No dishes found');
      console.log('\n💡 You need to create users and dishes before generating order test data.');
    } else {
      console.log('\n✅ Ready to generate order test data!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkExistingData(); 