const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Section = require('../models/section');

// Use the same connection as the backend
const mongoURI = require('../config/keys').mongoURI;
const connectionOptions = [
  mongoURI,
  'mongodb://localhost:27017/foodtok', // fallback for local development
];

// Comprehensive dish collection
const dishTemplates = [
  // Quick service dishes
  {
    name: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    price: 12.99,
    category: 'Main Course',
    cookingTime: 15,
    ingredients: 'Beef patty, lettuce, tomato, onion, special sauce',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    name: 'Chicken Wings',
    description: 'Crispy chicken wings with your choice of sauce',
    price: 9.99,
    category: 'Appetizers',
    cookingTime: 20,
    ingredients: 'Chicken wings, buffalo sauce, celery, ranch dressing',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with caesar dressing and croutons',
    price: 8.99,
    category: 'Salads',
    cookingTime: 10,
    ingredients: 'Romaine lettuce, caesar dressing, croutons, parmesan',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 14.99,
    category: 'Pizza',
    cookingTime: 18,
    ingredients: 'Pizza dough, tomato sauce, mozzarella, fresh basil',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
  },
  {
    name: 'Spaghetti Bolognese',
    description: 'Traditional pasta with rich meat sauce',
    price: 16.99,
    category: 'Pasta',
    cookingTime: 25,
    ingredients: 'Spaghetti, ground beef, tomato sauce, herbs',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
  },
  {
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet with lemon and herbs',
    price: 22.99,
    category: 'Main Course',
    cookingTime: 20,
    ingredients: 'Salmon fillet, lemon, herbs, olive oil',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
  {
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with chocolate frosting',
    price: 6.99,
    category: 'Desserts',
    cookingTime: 5,
    ingredients: 'Chocolate cake, chocolate frosting, cocoa powder',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
  },
  {
    name: 'Fresh Juice',
    description: 'Freshly squeezed orange juice',
    price: 4.99,
    category: 'Beverages',
    cookingTime: 3,
    ingredients: 'Fresh oranges',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
  },
  {
    name: 'Fish Tacos',
    description: 'Grilled fish with cabbage slaw in soft tortillas',
    price: 13.99,
    category: 'Main Course',
    cookingTime: 18,
    ingredients: 'Fish fillet, tortillas, cabbage, lime, cilantro',
    image: 'https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400',
  },
  {
    name: 'Greek Salad',
    description: 'Fresh vegetables with feta cheese and olives',
    price: 10.99,
    category: 'Salads',
    cookingTime: 8,
    ingredients: 'Tomatoes, cucumber, feta cheese, olives, olive oil',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
  },
];

async function connectToDatabase() {
  for (const connectionString of connectionOptions) {
    try {
      console.log(`🔌 Trying to connect to: ${connectionString}`);
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ Connected to MongoDB successfully!');
      
      // Test the connection by listing collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📋 Found collections: ${collections.map(c => c.name).join(', ')}`);
      
      return true;
    } catch (error) {
      console.log(`❌ Failed to connect to ${connectionString}: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  throw new Error('Could not connect to any MongoDB instance');
}

async function createSampleChef() {
  try {
    // Check if we have any chefs
    const existingChefs = await User.find({ type: 'chef' }).limit(1);
    
    if (existingChefs.length === 0) {
      console.log('📝 No chefs found, creating a sample chef...');
      
      const sampleChef = new User({
        fullName: 'Alex Thompson',
        username: 'alex_chef',
        email: 'alex@foodtok.com',
        password: 'hashedpassword123', // In real app, this would be properly hashed
        type: 'chef',
        profileCompleted: true,
        phone: '1234567890',
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200',
        bio: 'Passionate chef creating delicious meals',
        created_at: new Date(),
      });
      
      await sampleChef.save();
      console.log('✅ Created sample chef: Alex Thompson');
      return sampleChef;
    }
    
    return existingChefs[0];
  } catch (error) {
    console.error('❌ Error creating sample chef:', error);
    throw error;
  }
}

async function setupChefMenu(chef) {
  try {
    console.log(`\n👨‍🍳 Setting up menu for: ${chef.fullName}`);
    
    // Create or find menu
    let menu = await Menu.findOne({ chef: chef._id });
    if (!menu) {
      menu = new Menu({
        name: `${chef.fullName}'s Kitchen`,
        description: `Delicious dishes by ${chef.fullName}`,
        chef: chef._id,
        sections: [], // Will be populated with section IDs
        created_at: new Date(),
      });
      await menu.save();
      console.log('📋 Created menu');
    }
    
    // Create sections
    const sections = ['Appetizers', 'Main Course', 'Pizza', 'Pasta', 'Salads', 'Desserts', 'Beverages'];
    const sectionMap = {};
    
    for (const sectionName of sections) {
      let section = await Section.findOne({ name: sectionName, owner: chef._id });
      if (!section) {
        section = new Section({
          name: sectionName,
          description: `${sectionName} section`,
          owner: chef._id,
          created_at: new Date(),
        });
        await section.save();
        console.log(`📁 Created section: ${sectionName}`);
      }
      sectionMap[sectionName] = section._id;
    }
    
    // Add dishes
    const existingDishes = await Dish.find({ owner: chef._id });
    console.log(`📊 Chef currently has ${existingDishes.length} dishes`);
    
    if (existingDishes.length < 8) {
      const dishesToAdd = dishTemplates.slice(0, 8 - existingDishes.length);
      
      for (const dishData of dishesToAdd) {
        const existingDish = await Dish.findOne({ 
          name: dishData.name, 
          owner: chef._id 
        });
        
        if (!existingDish) {
          const dish = new Dish({
            ...dishData,
            owner: chef._id,
            menu: menu._id,
            section: sectionMap[dishData.category],
            visible: true,
            average_rating: Math.random() * 2 + 3, // 3-5 stars
            created_at: new Date(),
          });
          
          await dish.save();
          console.log(`🍽️  Added: ${dishData.name} ($${dishData.price})`);
        }
      }
    }
    
    // Final count
    const finalCount = await Dish.countDocuments({ owner: chef._id });
    console.log(`✅ ${chef.fullName} now has ${finalCount} dishes`);
    
    return finalCount;
  } catch (error) {
    console.error(`❌ Error setting up menu for ${chef.fullName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting dish generation process...\n');
    
    // Connect to database
    await connectToDatabase();
    
    // Find all chefs or create sample
    let chefs = await User.find({ type: 'chef' });
    console.log(`👨‍🍳 Found ${chefs.length} chefs in database`);
    
    if (chefs.length === 0) {
      const sampleChef = await createSampleChef();
      chefs = [sampleChef];
    }
    
    // Process each chef
    let totalDishesAdded = 0;
    for (const chef of chefs) {
      const dishCount = await setupChefMenu(chef);
      totalDishesAdded += dishCount;
    }
    
    console.log('\n🎉 Process completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Chefs processed: ${chefs.length}`);
    console.log(`   - Total dishes in database: ${totalDishesAdded}`);
    
    // Verification
    console.log('\n🔍 Verification:');
    for (const chef of chefs.slice(0, 3)) {
      const dishCount = await Dish.countDocuments({ owner: chef._id });
      console.log(`   - ${chef.fullName}: ${dishCount} dishes`);
    }
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check if the database exists');
    console.log('3. Verify the User, Menu, Dish, and Section models exist');
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted, cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main();