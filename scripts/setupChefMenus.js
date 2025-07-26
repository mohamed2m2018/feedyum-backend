const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Section = require('../models/section');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/foodtok', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample dish categories and sections
const dishCategories = [
  'Appetizers',
  'Main Course', 
  'Desserts',
  'Beverages',
  'Salads',
  'Soups',
  'Pasta',
  'Pizza',
  'Seafood',
  'Grilled',
];

const sampleDishes = [
  // Appetizers
  {
    name: 'Crispy Calamari',
    description: 'Fresh squid rings served with marinara sauce and lemon',
    price: 12.99,
    category: 'Appetizers',
    cookingTime: 15,
    ingredients: 'Squid, flour, marinara sauce, lemon, herbs',
    image: 'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=400',
  },
  {
    name: 'Buffalo Wings',
    description: 'Spicy chicken wings with blue cheese dip',
    price: 10.99,
    category: 'Appetizers', 
    cookingTime: 20,
    ingredients: 'Chicken wings, buffalo sauce, blue cheese, celery',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
  },
  {
    name: 'Mozzarella Sticks',
    description: 'Golden fried mozzarella with marinara sauce',
    price: 8.99,
    category: 'Appetizers',
    cookingTime: 12,
    ingredients: 'Mozzarella cheese, breadcrumbs, marinara sauce',
    image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=400',
  },
  
  // Main Course
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon herb butter and vegetables',
    price: 24.99,
    category: 'Main Course',
    cookingTime: 25,
    ingredients: 'Salmon fillet, lemon, herbs, butter, seasonal vegetables',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
  },
  {
    name: 'Ribeye Steak',
    description: 'Premium ribeye steak with garlic mashed potatoes',
    price: 32.99,
    category: 'Main Course',
    cookingTime: 30,
    ingredients: 'Ribeye steak, potatoes, garlic, butter, herbs',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
  },
  {
    name: 'Chicken Parmesan',
    description: 'Breaded chicken breast with marinara and mozzarella',
    price: 19.99,
    category: 'Main Course',
    cookingTime: 35,
    ingredients: 'Chicken breast, breadcrumbs, marinara, mozzarella, pasta',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
  },
  
  // Pasta
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with eggs, cheese, and pancetta',
    price: 16.99,
    category: 'Pasta',
    cookingTime: 20,
    ingredients: 'Spaghetti, eggs, parmesan, pancetta, black pepper',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
  },
  {
    name: 'Fettuccine Alfredo',
    description: 'Creamy alfredo sauce with fettuccine pasta',
    price: 15.99,
    category: 'Pasta',
    cookingTime: 18,
    ingredients: 'Fettuccine, heavy cream, parmesan, butter, garlic',
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
  },
  
  // Pizza
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato, mozzarella, and basil',
    price: 14.99,
    category: 'Pizza',
    cookingTime: 15,
    ingredients: 'Pizza dough, tomato sauce, mozzarella, fresh basil',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
  },
  {
    name: 'Pepperoni Pizza',
    description: 'Traditional pepperoni pizza with mozzarella cheese',
    price: 16.99,
    category: 'Pizza',
    cookingTime: 15,
    ingredients: 'Pizza dough, tomato sauce, mozzarella, pepperoni',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
  },
  
  // Desserts
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center and vanilla ice cream',
    price: 8.99,
    category: 'Desserts',
    cookingTime: 12,
    ingredients: 'Dark chocolate, butter, eggs, flour, vanilla ice cream',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
  },
  {
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee and mascarpone',
    price: 7.99,
    category: 'Desserts',
    cookingTime: 5,
    ingredients: 'Ladyfingers, coffee, mascarpone, cocoa powder',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
  },
  
  // Beverages
  {
    name: 'Fresh Lemonade',
    description: 'Freshly squeezed lemon juice with mint',
    price: 4.99,
    category: 'Beverages',
    cookingTime: 5,
    ingredients: 'Fresh lemons, sugar, water, mint leaves',
    image: 'https://images.unsplash.com/photo-1523371683702-af5338c08c2d?w=400',
  },
  {
    name: 'Iced Coffee',
    description: 'Cold brew coffee with milk and vanilla syrup',
    price: 5.99,
    category: 'Beverages',
    cookingTime: 3,
    ingredients: 'Coffee beans, milk, vanilla syrup, ice',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
  },
];

async function setupChefMenus() {
  try {
    console.log('🚀 Starting chef menu setup...');
    
    // Find all chef users
    const chefs = await User.find({ type: 'chef' }).select('_id fullName username');
    console.log(`📋 Found ${chefs.length} chefs in database`);
    
    if (chefs.length === 0) {
      console.log('❌ No chefs found in database. Creating sample chefs first...');
      await createSampleChefs();
      return;
    }
    
    let menusCreated = 0;
    let dishesCreated = 0;
    
    for (const chef of chefs) {
      console.log(`\n👨‍🍳 Processing chef: ${chef.fullName} (${chef._id})`);
      
      // Check if chef already has a menu
      let menu = await Menu.findOne({ owner: chef._id });
      
      if (!menu) {
        // Create menu for chef
        menu = new Menu({
          name: `${chef.fullName}'s Menu`,
          description: `Delicious dishes crafted by ${chef.fullName}`,
          owner: chef._id,
          created_at: new Date(),
        });
        
        await menu.save();
        menusCreated++;
        console.log(`✅ Created menu for ${chef.fullName}`);
      } else {
        console.log(`📋 Menu already exists for ${chef.fullName}`);
      }
      
      // Create sections for the menu
      const sectionsToCreate = ['Appetizers', 'Main Course', 'Pasta', 'Pizza', 'Desserts', 'Beverages'];
      const createdSections = {};
      
      for (const sectionName of sectionsToCreate) {
        let section = await Section.findOne({ 
          name: sectionName, 
          owner: chef._id 
        });
        
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
        
        createdSections[sectionName] = section._id;
      }
      
      // Check existing dishes for this chef
      const existingDishes = await Dish.find({ owner: chef._id });
      console.log(`📊 Chef has ${existingDishes.length} existing dishes`);
      
      if (existingDishes.length < 5) {
        // Add sample dishes for this chef
        const dishesToAdd = Math.min(8, 12 - existingDishes.length); // Add up to 8 dishes, max 12 total
        const selectedDishes = sampleDishes
          .sort(() => 0.5 - Math.random()) // Randomize
          .slice(0, dishesToAdd);
        
        for (const dishData of selectedDishes) {
          const dish = new Dish({
            ...dishData,
            owner: chef._id,
            menu: menu._id,
            section: createdSections[dishData.category] || null,
            visible: true,
            average_rating: Math.random() * 2 + 3, // Random rating between 3-5
            created_at: new Date(),
          });
          
          await dish.save();
          dishesCreated++;
          console.log(`🍽️  Added dish: ${dishData.name}`);
        }
      }
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Menus created: ${menusCreated}`);
    console.log(`   - Dishes created: ${dishesCreated}`);
    console.log(`   - Total chefs processed: ${chefs.length}`);
    
  } catch (error) {
    console.error('❌ Error setting up chef menus:', error);
  } finally {
    mongoose.connection.close();
  }
}

async function createSampleChefs() {
  console.log('👨‍🍳 Creating sample chefs...');
  
  const sampleChefs = [
    {
      fullName: 'Mario Giuseppe',
      username: 'mario_chef',
      email: 'mario@foodtok.com',
      password: 'password123',
      type: 'chef',
      profileCompleted: true,
      phone: '1234567890',
    },
    {
      fullName: 'Isabella Rodriguez',
      username: 'bella_chef',
      email: 'isabella@foodtok.com',
      password: 'password123',
      type: 'chef',
      profileCompleted: true,
      phone: '1234567891',
    },
    {
      fullName: 'Chen Wei',
      username: 'chen_chef',
      email: 'chen@foodtok.com',
      password: 'password123',
      type: 'chef',
      profileCompleted: true,
      phone: '1234567892',
    },
    {
      fullName: 'Ahmed Hassan',
      username: 'ahmed_chef',
      email: 'ahmed@foodtok.com',
      password: 'password123',
      type: 'chef',
      profileCompleted: true,
      phone: '1234567893',
    },
    {
      fullName: 'Sophie Laurent',
      username: 'sophie_chef',
      email: 'sophie@foodtok.com',
      password: 'password123',
      type: 'chef',
      profileCompleted: true,
      phone: '1234567894',
    },
  ];
  
  for (const chefData of sampleChefs) {
    const existingChef = await User.findOne({ 
      $or: [
        { email: chefData.email },
        { username: chefData.username }
      ]
    });
    
    if (!existingChef) {
      const chef = new User(chefData);
      await chef.save();
      console.log(`✅ Created chef: ${chefData.fullName}`);
    } else {
      console.log(`👨‍🍳 Chef already exists: ${chefData.fullName}`);
    }
  }
  
  console.log('🎉 Sample chefs created! Running menu setup...');
  await setupChefMenus();
}

// Run the setup
setupChefMenus();