const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Section = require('../models/section');

// Use the same connection as your server
const mongoURI = require('../config/keys').mongoURI;

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to remote MongoDB Atlas...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    process.exit(1);
  }
};

// Sample dishes with proper structure
const dishTemplates = [
  {
    name: 'Buffalo Wings',
    description: 'Spicy chicken wings with blue cheese dip',
    price: 10.99,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
  },
  {
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    price: 12.99,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 14.99,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, and pancetta',
    price: 16.99,
    category: 'Pasta',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with caesar dressing and croutons',
    price: 8.99,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
  },
  {
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet with lemon and herbs',
    price: 22.99,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
  {
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with chocolate frosting',
    price: 6.99,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
  },
  {
    name: 'Fresh Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.99,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
  },
];

async function addDishesToAllChefs() {
  try {
    console.log('🚀 Adding dishes to ALL chefs in database...');
    
    // Find ALL chef users
    const chefs = await User.find({ type: 'chef' }).select('_id fullName username');
    console.log(`👨‍🍳 Found ${chefs.length} chefs in database`);
    
    if (chefs.length === 0) {
      console.log('❌ No chefs found in database.');
      return;
    }
    
    let menusCreated = 0;
    let sectionsCreated = 0;
    let dishesCreated = 0;
    
    // Get the highest existing dish ID to continue numbering
    const lastDish = await Dish.findOne().sort({ id: -1 });
    let nextDishId = lastDish ? lastDish.id + 1 : 1;
    
    for (const chef of chefs) {
      console.log(`\n👨‍🍳 Processing chef: ${chef.fullName} (${chef._id})`);
      
      // Check if chef already has a menu (using correct field name)
      let menu = await Menu.findOne({ chef: chef._id });
      
      if (!menu) {
        // Create menu for chef
        menu = new Menu({
          name: `${chef.fullName}'s Kitchen`,
          description: `Delicious dishes crafted by ${chef.fullName}`,
          chef: chef._id, // Correct field name for Menu model
          sections: [], // Required field
          created_at: new Date(),
        });
        
        await menu.save();
        menusCreated++;
        console.log(`✅ Created menu for ${chef.fullName}`);
      } else {
        console.log(`📋 Menu already exists for ${chef.fullName}`);
      }
      
      // Create sections for the menu (using correct field name)
      const sectionsToCreate = ['Appetizers', 'Main Course', 'Pasta', 'Pizza', 'Salads', 'Desserts', 'Beverages'];
      const createdSections = {};
      
      for (const sectionName of sectionsToCreate) {
        let section = await Section.findOne({ 
          name: sectionName, 
          owner: chef._id // Section model uses 'owner' field
        });
        
        if (!section) {
          section = new Section({
            name: sectionName,
            description: `${sectionName} by ${chef.fullName}`,
            owner: chef._id, // Correct field name for Section model
            created_at: new Date(),
          });
          
          await section.save();
          sectionsCreated++;
          console.log(`📁 Created section: ${sectionName}`);
        }
        
        createdSections[sectionName] = section._id;
      }
      
      // Check existing dishes for this chef (using correct field name)
      const existingDishes = await Dish.find({ user_id: chef._id.toString() });
      console.log(`📊 Chef has ${existingDishes.length} existing dishes`);
      
      // Add dishes if chef has fewer than 8
      const targetDishCount = 8;
      const dishesToAdd = Math.max(0, targetDishCount - existingDishes.length);
      
      if (dishesToAdd > 0) {
        // Randomly select dishes from our template
        const selectedDishes = dishTemplates
          .sort(() => 0.5 - Math.random()) // Randomize
          .slice(0, dishesToAdd);
        
        for (const dishData of selectedDishes) {
          // Check if this exact dish already exists for this chef
          const existingDish = await Dish.findOne({ 
            name: dishData.name, 
            user_id: chef._id.toString() // Correct field name for Dish model
          });
          
          if (!existingDish) {
            const dish = new Dish({
              id: nextDishId++, // Required numeric ID
              name: dishData.name,
              description: dishData.description,
              category: dishData.category,
              section: createdSections[dishData.category] || null,
              price: dishData.price,
              menu: menu._id,
              menu_id: parseInt(menu._id.toString().slice(-6), 16), // Required numeric menu_id
              user_id: chef._id.toString(), // Required string field
              visible: true,
              average_rating: Math.random() * 2 + 3, // Random rating between 3-5
              image: dishData.image,
              created_at: new Date(),
            });
            
            await dish.save();
            dishesCreated++;
            console.log(`🍽️  Added dish: ${dishData.name} ($${dishData.price})`);
          }
        }
      } else {
        console.log(`✅ Chef already has sufficient dishes (${existingDishes.length})`);
      }
      
      // Show final count for this chef
      const finalDishCount = await Dish.countDocuments({ user_id: chef._id.toString() });
      console.log(`📊 ${chef.fullName} now has ${finalDishCount} total dishes`);
    }
    
    console.log('\n🎉 Dish addition completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Chefs processed: ${chefs.length}`);
    console.log(`   - Menus created: ${menusCreated}`);
    console.log(`   - Sections created: ${sectionsCreated}`);
    console.log(`   - Dishes added: ${dishesCreated}`);
    
    // Final verification
    console.log('\n🔍 Final verification:');
    for (const chef of chefs.slice(0, 5)) { // Show first 5 chefs
      const dishCount = await Dish.countDocuments({ user_id: chef._id.toString() });
      console.log(`   - ${chef.fullName}: ${dishCount} dishes`);
    }
    
    if (chefs.length > 5) {
      console.log(`   ... and ${chefs.length - 5} more chefs with dishes`);
    }
    
  } catch (error) {
    console.error('❌ Error adding dishes to chefs:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the setup
async function main() {
  await connectDB();
  await addDishesToAllChefs();
}

main().catch(console.error);