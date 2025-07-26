const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');

const keys = require('../config/keys');

// Connect to MongoDB
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixDishMenuReferences() {
  try {
    console.log('🔧 Fixing dish menu references...\n');
    
    // Find dishes without menu references
    const dishesWithoutMenu = await Dish.find({ 
      $or: [
        { menu: { $exists: false } },
        { menu: null }
      ]
    });
    
    console.log(`📊 Found ${dishesWithoutMenu.length} dishes without menu references`);
    
    if (dishesWithoutMenu.length === 0) {
      console.log('✅ All dishes already have menu references!');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    // Group dishes by chef
    const dishesByChef = {};
    dishesWithoutMenu.forEach(dish => {
      const chefId = dish.user_id.toString();
      if (!dishesByChef[chefId]) {
        dishesByChef[chefId] = [];
      }
      dishesByChef[chefId].push(dish);
    });
    
    console.log(`\n👨‍🍳 Processing ${Object.keys(dishesByChef).length} chefs...\n`);
    
    for (const [chefId, dishes] of Object.entries(dishesByChef)) {
      try {
        // Find chef
        const chef = await User.findById(chefId);
        if (!chef) {
          console.log(`❌ Chef not found: ${chefId}`);
          errorCount += dishes.length;
          continue;
        }
        
        console.log(`👨‍🍳 Processing ${chef.fullName} (${dishes.length} dishes)`);
        
        // Find or create menu for this chef
        let menu = await Menu.findOne({ chef: chefId });
        
        if (!menu) {
          // Create a menu for this chef
          menu = new Menu({
            name: `${chef.fullName}'s Menu`,
            description: `Delicious dishes crafted by ${chef.fullName}`,
            chef: chefId,
            dishes: [],
            sections: [],
            created_at: new Date(),
          });
          
          await menu.save();
          console.log(`   ✅ Created new menu: ${menu.name}`);
        }
        
        // Update dishes to reference this menu
        const dishIds = dishes.map(dish => dish._id);
        
        // Generate a numeric menu_id based on the menu's creation order
        const menuCount = await Menu.countDocuments({ chef: chefId });
        const numericMenuId = menuCount;
        
        await Dish.updateMany(
          { _id: { $in: dishIds } },
          { 
            $set: { 
              menu: menu._id,
              menu_id: numericMenuId
            }
          }
        );
        
        // Update menu to include these dishes
        const existingDishIds = menu.dishes || [];
        const newDishIds = [...new Set([...existingDishIds, ...dishIds])];
        
        await Menu.findByIdAndUpdate(menu._id, {
          dishes: newDishIds
        });
        
        console.log(`   ✅ Fixed ${dishes.length} dishes for ${chef.fullName}`);
        fixedCount += dishes.length;
        
      } catch (error) {
        console.log(`   ❌ Error processing chef ${chefId}:`, error.message);
        errorCount += dishes.length;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} dishes`);
    console.log(`   ❌ Errors: ${errorCount} dishes`);
    
    // Verify the fix
    const remainingDishesWithoutMenu = await Dish.find({ 
      $or: [
        { menu: { $exists: false } },
        { menu: null }
      ]
    });
    
    console.log(`   📋 Remaining dishes without menu: ${remainingDishesWithoutMenu.length}`);
    
    if (remainingDishesWithoutMenu.length === 0) {
      console.log('\n🎉 All dishes now have menu references!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing dish menu references:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDishMenuReferences();