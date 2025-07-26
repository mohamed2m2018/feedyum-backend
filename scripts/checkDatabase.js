const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Section = require('../models/section');

const keys = require('../config/keys');

// Connect to MongoDB
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Check users
    const totalUsers = await User.countDocuments();
    const chefs = await User.find({ type: 'chef' }).select('_id fullName username');
    console.log(`👥 Users: ${totalUsers} total, ${chefs.length} chefs`);
    
    if (chefs.length > 0) {
      console.log('   Chefs:');
      chefs.forEach(chef => {
        console.log(`   - ${chef.fullName} (${chef._id})`);
      });
    }
    
    // Check menus
    const totalMenus = await Menu.countDocuments();
    const menus = await Menu.find().populate('chef', 'fullName').select('name chef');
    console.log(`\n📋 Menus: ${totalMenus} total`);
    
    if (menus.length > 0) {
      console.log('   Menus:');
      menus.forEach(menu => {
        console.log(`   - ${menu.name} by ${menu.chef?.fullName || 'Unknown'} (${menu._id})`);
      });
    }
    
    // Check sections
    const totalSections = await Section.countDocuments();
    console.log(`\n📁 Sections: ${totalSections} total`);
    
    // Check dishes
    const totalDishes = await Dish.countDocuments();
    const dishes = await Dish.find().populate('menu', 'name').select('name price user_id menu visible');
    console.log(`\n🍽️  Dishes: ${totalDishes} total`);
    
    if (dishes.length > 0) {
      console.log('   Dishes:');
      dishes.forEach(dish => {
        console.log(`   - ${dish.name} ($${dish.price}) - Chef: ${dish.user_id} - Menu: ${dish.menu?.name || 'No menu'} - Visible: ${dish.visible}`);
      });
      
      // Group dishes by chef
      const dishesByChef = {};
      dishes.forEach(dish => {
        const chefId = dish.user_id.toString();
        if (!dishesByChef[chefId]) {
          dishesByChef[chefId] = [];
        }
        dishesByChef[chefId].push(dish);
      });
      
      console.log('\n📊 Dishes by Chef:');
      Object.entries(dishesByChef).forEach(([chefId, chefDishes]) => {
        const chef = chefs.find(c => c._id.toString() === chefId);
        console.log(`   - ${chef?.fullName || 'Unknown Chef'} (${chefId}): ${chefDishes.length} dishes`);
      });
    }
    
    // Check for potential issues
    console.log('\n🔧 Potential Issues:');
    
    // Check for dishes without menus
    const dishesWithoutMenu = await Dish.find({ menu: { $exists: false } });
    if (dishesWithoutMenu.length > 0) {
      console.log(`   ⚠️  ${dishesWithoutMenu.length} dishes without menu reference`);
    }
    
    // Check for invisible dishes
    const invisibleDishes = await Dish.find({ visible: false });
    if (invisibleDishes.length > 0) {
      console.log(`   ⚠️  ${invisibleDishes.length} dishes marked as invisible`);
    }
    
    // Check for chefs without menus
    const chefsWithoutMenus = [];
    for (const chef of chefs) {
      const chefMenu = await Menu.findOne({ chef: chef._id });
      if (!chefMenu) {
        chefsWithoutMenus.push(chef);
      }
    }
    
    if (chefsWithoutMenus.length > 0) {
      console.log(`   ⚠️  ${chefsWithoutMenus.length} chefs without menus:`);
      chefsWithoutMenus.forEach(chef => {
        console.log(`      - ${chef.fullName}`);
      });
    }
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
checkDatabase();