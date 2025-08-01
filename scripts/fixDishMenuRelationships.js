const mongoose = require('mongoose');
const Dish = require('../models/dish');
const User = require('../models/user');
const Menu = require('../models/menu');

// Connect to MongoDB
const keys = require('../config/keys');
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixDishMenuRelationships() {
  try {
    console.log('Starting to fix dish-menu relationships...');

    // Get all dishes
    const dishes = await Dish.find({});
    console.log(`Found ${dishes.length} dishes`);

    // Get all chefs
    const chefs = await User.find({ type: 'chef' });
    console.log(`Found ${chefs.length} chefs`);

    // Get all menus
    const menus = await Menu.find({});
    console.log(`Found ${menus.length} menus`);

    let fixedCount = 0;
    let createdMenusCount = 0;

    for (const dish of dishes) {
      let needsUpdate = false;
      let dishUpdate = {};

      // Check if dish has a valid menu reference
      if (!dish.menu) {
        console.log(`Dish "${dish.name}" has no menu reference`);
        
        // Find or create a menu for this chef
        const chefId = dish.user_id;
        let chefMenu = menus.find(menu => 
          menu.chef && menu.chef.toString() === chefId.toString()
        );

        if (!chefMenu) {
          // Create a new menu for this chef
          const chef = chefs.find(c => c._id.toString() === chefId.toString());
          if (chef) {
            console.log(`Creating new menu for chef: ${chef.fullName}`);
            
            chefMenu = new Menu({
              name: `${chef.fullName}'s Menu`,
              description: `Delicious dishes by ${chef.fullName}`,
              chef: chef._id,
              dishes: [],
              sections: [],
              created_at: new Date()
            });
            
            await chefMenu.save();
            menus.push(chefMenu); // Add to our local array
            createdMenusCount++;
            console.log(`Created menu: ${chefMenu.name}`);
          }
        }

        if (chefMenu) {
          dishUpdate.menu = chefMenu._id;
          dishUpdate.menu_id = chefMenu.menu_id || Math.floor(Math.random() * 1000000);
          needsUpdate = true;
        }
      } else {
        // Check if the menu exists
        const menuExists = menus.find(menu => 
          menu._id.toString() === dish.menu.toString()
        );
        
        if (!menuExists) {
          console.log(`Dish "${dish.name}" references non-existent menu: ${dish.menu}`);
          
          // Find or create a menu for this chef
          const chefId = dish.user_id;
          let chefMenu = menus.find(menu => 
            menu.chef && menu.chef.toString() === chefId.toString()
          );

          if (!chefMenu) {
            // Create a new menu for this chef
            const chef = chefs.find(c => c._id.toString() === chefId.toString());
            if (chef) {
              console.log(`Creating new menu for chef: ${chef.fullName}`);
              
              chefMenu = new Menu({
                name: `${chef.fullName}'s Menu`,
                description: `Delicious dishes by ${chef.fullName}`,
                chef: chef._id,
                dishes: [],
                sections: [],
                created_at: new Date()
              });
              
              await chefMenu.save();
              menus.push(chefMenu); // Add to our local array
              createdMenusCount++;
              console.log(`Created menu: ${chefMenu.name}`);
            }
          }

          if (chefMenu) {
            dishUpdate.menu = chefMenu._id;
            dishUpdate.menu_id = chefMenu.menu_id || Math.floor(Math.random() * 1000000);
            needsUpdate = true;
          }
        }
      }

      // Update the dish if needed
      if (needsUpdate) {
        await Dish.findByIdAndUpdate(dish._id, dishUpdate);
        fixedCount++;
        console.log(`Fixed dish: ${dish.name} -> Menu: ${dishUpdate.menu}`);
      }
    }

    // Now ensure all menus have their dishes properly linked
    console.log('\nUpdating menu-dish relationships...');
    
    for (const menu of menus) {
      const menuDishes = await Dish.find({ menu: menu._id });
      
      if (menuDishes.length > 0) {
        // Update menu with dish references if needed
        const dishIds = menuDishes.map(dish => dish._id);
        await Menu.findByIdAndUpdate(menu._id, { 
          dishes: dishIds,
          $set: { hasMenu: true }
        });
        
        console.log(`Updated menu "${menu.name}" with ${menuDishes.length} dishes`);
      }
    }

    // Update chef hasMenu flag
    console.log('\nUpdating chef hasMenu flags...');
    
    for (const chef of chefs) {
      const chefMenus = menus.filter(menu => 
        menu.chef && menu.chef.toString() === chef._id.toString()
      );
      
      const hasMenu = chefMenus.length > 0;
      await User.findByIdAndUpdate(chef._id, { hasMenu });
      
      if (hasMenu) {
        console.log(`Chef ${chef.fullName} has ${chefMenus.length} menu(s)`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} dishes`);
    console.log(`✅ Created ${createdMenusCount} new menus`);
    console.log('✅ All dish-menu relationships are now properly linked');

  } catch (error) {
    console.error('Error fixing dish-menu relationships:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
fixDishMenuRelationships();