const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load models
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Order = require('../models/order');
const Category = require('../models/category');
const Section = require('../models/section');

// Test Chef Data
const CHEF_TEST_DATA = {
  email: 'chef.mario@foodtest.com',
  username: 'chef_mario_test',
  password: 'ChefTest123!',
  fullName: 'Mario Giuseppe',
  phone: '+1-555-CHEF-001',
  bio: 'Authentic Italian cuisine chef with 15 years of experience. Specializing in traditional pasta, pizza, and Mediterranean dishes.',
  type: 'chef',
  hasMenu: true,
  profileCompleted: true,
  avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
  locations: [{
    description: 'Little Italy, New York',
    lat: 40.7191,
    long: -73.9973
  }],
  wallet: 250.75
};

// Menu and Section Data
const MENU_DATA = {
  name: "Mario's Authentic Italian Kitchen",
  description: "Traditional Italian recipes passed down through generations. Fresh ingredients, handmade pasta, and authentic flavors from the heart of Italy."
};

const SECTIONS_DATA = [
  { name: 'Appetizers', description: 'Fresh starters to begin your meal' },
  { name: 'Pasta & Risotto', description: 'Handmade pasta and creamy risottos' },
  { name: 'Pizza', description: 'Wood-fired pizzas with fresh toppings' },
  { name: 'Main Courses', description: 'Traditional Italian main dishes' },
  { name: 'Desserts', description: 'Sweet endings to your meal' },
  { name: 'Beverages', description: 'Italian wines and drinks' }
];

// Categories Data
const CATEGORIES_DATA = [
  { name: 'Italian', nameArabic: 'إيطالي', description: 'Authentic Italian cuisine' },
  { name: 'Pasta', nameArabic: 'معكرونة', description: 'Various pasta dishes' },
  { name: 'Pizza', nameArabic: 'بيتزا', description: 'Traditional and gourmet pizzas' },
  { name: 'Seafood', nameArabic: 'مأكولات بحرية', description: 'Fresh seafood dishes' },
  { name: 'Vegetarian', nameArabic: 'نباتي', description: 'Plant-based dishes' },
  { name: 'Dessert', nameArabic: 'حلويات', description: 'Sweet treats and desserts' },
  { name: 'Beverages', nameArabic: 'مشروبات', description: 'Drinks and beverages' }
];

// Dishes Data
const DISHES_DATA = [
  // Appetizers
  {
    name: 'Bruschetta Italiana',
    description: 'Grilled bread topped with fresh tomatoes, basil, garlic, and extra virgin olive oil',
    price: 12.99,
    category: 'Italian',
    section: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1572441002284-47ba9eaf14ab?w=400',
    visible: true,
    average_rating: 4.8,
    cookingTime: 10,
    ingredients: 'Tomatoes, Basil, Garlic, Olive Oil, Bread'
  },
  {
    name: 'Antipasto Platter',
    description: 'Selection of cured meats, cheeses, olives, and marinated vegetables',
    price: 18.99,
    category: 'Italian',
    section: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
    visible: true,
    average_rating: 4.6,
    cookingTime: 5,
    ingredients: 'Prosciutto, Salami, Mozzarella, Olives, Peppers'
  },
  {
    name: 'Arancini Siciliani',
    description: 'Crispy fried rice balls stuffed with mozzarella and peas',
    price: 14.99,
    category: 'Italian',
    section: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1541109310-eb17b76a7fa9?w=400',
    visible: true,
    average_rating: 4.7,
    cookingTime: 15,
    ingredients: 'Arborio Rice, Mozzarella, Peas, Breadcrumbs'
  },

  // Pasta & Risotto
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with eggs, pecorino cheese, pancetta, and black pepper',
    price: 22.99,
    category: 'Pasta',
    section: 'Pasta & Risotto',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc92d47c1?w=400',
    visible: true,
    average_rating: 4.9,
    cookingTime: 20,
    ingredients: 'Spaghetti, Eggs, Pecorino, Pancetta, Black Pepper'
  },
  {
    name: 'Fettuccine Alfredo',
    description: 'Creamy pasta with butter, parmesan cheese, and fresh parsley',
    price: 19.99,
    category: 'Pasta',
    section: 'Pasta & Risotto',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc92d47c1?w=400',
    visible: true,
    average_rating: 4.5,
    cookingTime: 18,
    ingredients: 'Fettuccine, Butter, Parmesan, Heavy Cream, Parsley'
  },
  {
    name: 'Risotto ai Funghi',
    description: 'Creamy risotto with mixed wild mushrooms and truffle oil',
    price: 26.99,
    category: 'Italian',
    section: 'Pasta & Risotto',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
    visible: true,
    average_rating: 4.8,
    cookingTime: 25,
    ingredients: 'Arborio Rice, Wild Mushrooms, Truffle Oil, Parmesan'
  },
  {
    name: 'Penne Arrabbiata',
    description: 'Spicy tomato sauce with garlic, red peppers, and fresh basil',
    price: 17.99,
    category: 'Pasta',
    section: 'Pasta & Risotto',
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d25a?w=400',
    visible: true,
    average_rating: 4.4,
    cookingTime: 15,
    ingredients: 'Penne, Tomatoes, Garlic, Red Peppers, Basil'
  },

  // Pizza
  {
    name: 'Margherita Classica',
    description: 'Traditional pizza with tomato sauce, fresh mozzarella, and basil',
    price: 16.99,
    category: 'Pizza',
    section: 'Pizza',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400',
    visible: true,
    average_rating: 4.7,
    cookingTime: 12,
    ingredients: 'Pizza Dough, Tomato Sauce, Mozzarella, Basil'
  },
  {
    name: 'Quattro Stagioni',
    description: 'Four seasons pizza with artichokes, mushrooms, ham, and olives',
    price: 24.99,
    category: 'Pizza',
    section: 'Pizza',
    image: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=400',
    visible: true,
    average_rating: 4.6,
    cookingTime: 15,
    ingredients: 'Pizza Dough, Artichokes, Mushrooms, Ham, Olives'
  },
  {
    name: 'Prosciutto e Rucola',
    description: 'Pizza with prosciutto, arugula, parmesan, and cherry tomatoes',
    price: 23.99,
    category: 'Pizza',
    section: 'Pizza',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400',
    visible: true,
    average_rating: 4.8,
    cookingTime: 14,
    ingredients: 'Pizza Dough, Prosciutto, Arugula, Parmesan, Cherry Tomatoes'
  },

  // Main Courses
  {
    name: 'Osso Buco alla Milanese',
    description: 'Braised veal shanks with vegetables, white wine, and broth',
    price: 32.99,
    category: 'Italian',
    section: 'Main Courses',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    visible: true,
    average_rating: 4.9,
    cookingTime: 45,
    ingredients: 'Veal Shanks, Carrots, Celery, Onions, White Wine'
  },
  {
    name: 'Branzino al Sale',
    description: 'Mediterranean sea bass baked in sea salt crust with herbs',
    price: 28.99,
    category: 'Seafood',
    section: 'Main Courses',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
    visible: true,
    average_rating: 4.7,
    cookingTime: 30,
    ingredients: 'Sea Bass, Sea Salt, Herbs, Lemon, Olive Oil'
  },
  {
    name: 'Eggplant Parmigiana',
    description: 'Layers of eggplant with tomato sauce, mozzarella, and parmesan',
    price: 21.99,
    category: 'Vegetarian',
    section: 'Main Courses',
    image: 'https://images.unsplash.com/photo-1572441002284-47ba9eaf14ab?w=400',
    visible: true,
    average_rating: 4.5,
    cookingTime: 35,
    ingredients: 'Eggplant, Tomato Sauce, Mozzarella, Parmesan, Basil'
  },

  // Desserts
  {
    name: 'Tiramisu Della Casa',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
    price: 9.99,
    category: 'Dessert',
    section: 'Desserts',
    image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400',
    visible: true,
    average_rating: 4.9,
    cookingTime: 5,
    ingredients: 'Ladyfingers, Coffee, Mascarpone, Cocoa, Sugar'
  },
  {
    name: 'Panna Cotta ai Frutti di Bosco',
    description: 'Silky vanilla panna cotta with mixed berry compote',
    price: 8.99,
    category: 'Dessert',
    section: 'Desserts',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    visible: true,
    average_rating: 4.6,
    cookingTime: 5,
    ingredients: 'Cream, Vanilla, Gelatin, Mixed Berries, Sugar'
  },
  {
    name: 'Cannoli Siciliani',
    description: 'Crispy pastry shells filled with sweet ricotta and chocolate chips',
    price: 7.99,
    category: 'Dessert',
    section: 'Desserts',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    visible: true,
    average_rating: 4.7,
    cookingTime: 10,
    ingredients: 'Pastry Shells, Ricotta, Chocolate Chips, Powdered Sugar'
  },

  // Beverages
  {
    name: 'Chianti Classico',
    description: 'Traditional Tuscan red wine with rich flavor and smooth finish',
    price: 12.99,
    category: 'Beverages',
    section: 'Beverages',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    visible: true,
    average_rating: 4.8,
    cookingTime: 0,
    ingredients: 'Sangiovese Grapes'
  },
  {
    name: 'Limoncello',
    description: 'Traditional Italian lemon liqueur, perfect digestif',
    price: 8.99,
    category: 'Beverages',
    section: 'Beverages',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
    visible: true,
    average_rating: 4.5,
    cookingTime: 0,
    ingredients: 'Lemon Zest, Alcohol, Sugar, Water'
  },
  {
    name: 'Espresso Italiano',
    description: 'Strong Italian coffee, perfectly brewed',
    price: 3.99,
    category: 'Beverages',
    section: 'Beverages',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    visible: true,
    average_rating: 4.9,
    cookingTime: 2,
    ingredients: 'Italian Coffee Beans'
  }
];

// Customer Test Data for Orders
const CUSTOMERS_DATA = [
  {
    email: 'customer1@test.com',
    username: 'foodie_anna',
    fullName: 'Anna Smith',
    phone: '+1-555-0101',
    type: 'customer',
    locations: [{
      description: 'Upper West Side, NYC',
      lat: 40.7869,
      long: -73.9753
    }]
  },
  {
    email: 'customer2@test.com',
    username: 'hungry_john',
    fullName: 'John Davidson',
    phone: '+1-555-0102',
    type: 'customer',
    locations: [{
      description: 'Brooklyn Heights, NYC',
      lat: 40.6955,
      long: -73.9952
    }]
  },
  {
    email: 'customer3@test.com',
    username: 'pizza_lover',
    fullName: 'Sarah Wilson',
    phone: '+1-555-0103',
    type: 'customer',
    locations: [{
      description: 'Chelsea, NYC',
      lat: 40.7465,
      long: -74.0014
    }]
  }
];

/**
 * Generate comprehensive chef test data
 */
async function generateChefTestData() {
  console.log('🍝 Starting comprehensive chef test data generation...');
  
  try {
    // 1. Create categories
    console.log('📂 Creating categories...');
    const categories = [];
    for (const categoryData of CATEGORIES_DATA) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        categories.push(category);
        console.log(`   ✅ Created category: ${category.name}`);
      } else {
        categories.push(existingCategory);
        console.log(`   ⚡ Category exists: ${existingCategory.name}`);
      }
    }

    // 2. Create or update chef user
    console.log('\n👨‍🍳 Creating chef account...');
    let chef = await User.findOne({ email: CHEF_TEST_DATA.email });
    
    if (chef) {
      console.log('   ⚡ Chef account already exists, updating...');
      Object.assign(chef, CHEF_TEST_DATA);
      chef.password = await bcrypt.hash(CHEF_TEST_DATA.password, 10);
      await chef.save();
    } else {
      const hashedPassword = await bcrypt.hash(CHEF_TEST_DATA.password, 10);
      chef = new User({
        ...CHEF_TEST_DATA,
        password: hashedPassword
      });
      await chef.save();
      console.log('   ✅ Created new chef account');
    }

    // 3. Create customer accounts for orders
    console.log('\n👥 Creating customer accounts...');
    const customers = [];
    for (const customerData of CUSTOMERS_DATA) {
      let customer = await User.findOne({ email: customerData.email });
      if (!customer) {
        const hashedPassword = await bcrypt.hash('Customer123!', 10);
        customer = new User({
          ...customerData,
          password: hashedPassword,
          profileCompleted: true
        });
        await customer.save();
        console.log(`   ✅ Created customer: ${customer.fullName}`);
      } else {
        console.log(`   ⚡ Customer exists: ${customer.fullName}`);
      }
      customers.push(customer);
    }

    // 4. Create sections
    console.log('\n📋 Creating menu sections...');
    const sections = [];
    for (const sectionData of SECTIONS_DATA) {
      const section = new Section({
        ...sectionData,
        owner: chef._id
      });
      await section.save();
      sections.push(section);
      console.log(`   ✅ Created section: ${section.name}`);
    }

    // 5. Create menu
    console.log('\n🍽️ Creating chef menu...');
    // Delete existing menu to avoid duplicates
    await Menu.deleteMany({ chef: chef._id });
    
    const menu = new Menu({
      ...MENU_DATA,
      chef: chef._id,
      sections: sections.map(s => s._id),
      dishes: [] // Will be populated after creating dishes
    });
    await menu.save();
    console.log(`   ✅ Created menu: ${menu.name}`);

    // 6. Create dishes
    console.log('\n🍕 Creating dishes...');
    const dishes = [];
    let dishIdCounter = 1000; // Starting ID for dishes
    
    for (const dishData of DISHES_DATA) {
      // Find the corresponding section and category
      const section = sections.find(s => s.name === dishData.section);
      const category = categories.find(c => c.name === dishData.category);
      
      const dish = new Dish({
        ...dishData,
        id: dishIdCounter++,
        section: section._id,
        category: category ? category.name : dishData.category,
        menu: menu._id,
        menu_id: parseInt(menu._id.toString().slice(-6), 16), // Convert ObjectId to number
        user_id: chef._id.toString(),
        isAvailable: dishData.visible
      });
      
      await dish.save();
      dishes.push(dish);
      console.log(`   ✅ Created dish: ${dish.name} ($${dish.price})`);
    }

    // Update menu with dish references
    menu.dishes = dishes.map(d => d._id);
    await menu.save();

    // 7. Create realistic orders
    console.log('\n📦 Creating realistic orders...');
    const orderStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    const orderCount = 25;
    
    for (let i = 0; i < orderCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const selectedDishes = dishes.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
      
      const items = selectedDishes.map(dish => ({
        dish: dish._id,
        quantity: Math.floor(Math.random() * 3) + 1
      }));
      
      const subtotal = items.reduce((sum, item) => {
        const dish = dishes.find(d => d._id.equals(item.dish));
        return sum + (dish.price * item.quantity);
      }, 0);
      
      const deliveryFee = Math.random() > 0.3 ? 4.99 : 0;
      const serviceFee = subtotal * 0.05;
      const tax = (subtotal + serviceFee) * 0.08;
      const totalPrice = subtotal + deliveryFee + serviceFee + tax;
      
      // Create orders with realistic timestamps
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(createdAt.getHours() - hoursAgo);
      
      const order = new Order({
        user: customer._id,
        chef: chef._id,
        items,
        totalPrice: Math.round(totalPrice * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee,
        serviceFee: Math.round(serviceFee * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        deliveryAddress: {
          nameLine: customer.locations[0].description,
          location: {
            lat: customer.locations[0].lat.toString(),
            long: customer.locations[0].long.toString()
          },
          isPrimary: true
        },
        specialInstructions: i % 4 === 0 ? 'Please ring the doorbell twice' : '',
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        created_at: createdAt
      });
      
      await order.save();
      console.log(`   ✅ Created order #${order._id.toString().slice(-6)} - $${order.totalPrice} (${order.status})`);
    }

    // 8. Update chef hasMenu flag
    chef.hasMenu = true;
    await chef.save();

    console.log('\n🎉 Chef test data generation completed successfully!');
    
    return {
      chef,
      menu,
      dishes,
      categories,
      sections,
      customers,
      stats: {
        categoriesCreated: categories.length,
        dishesCreated: dishes.length,
        ordersCreated: orderCount,
        customersCreated: customers.length
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating chef test data:', error);
    throw error;
  }
}

/**
 * Clean chef test data
 */
async function cleanChefTestData() {
  console.log('🧹 Cleaning chef test data...');
  
  try {
    // Find the test chef
    const chef = await User.findOne({ email: CHEF_TEST_DATA.email });
    if (!chef) {
      console.log('   ⚡ No test chef found to clean');
      return;
    }

    // Delete orders related to this chef
    const deletedOrders = await Order.deleteMany({ chef: chef._id });
    console.log(`   🗑️ Deleted ${deletedOrders.deletedCount} orders`);

    // Delete dishes related to this chef
    const deletedDishes = await Dish.deleteMany({ user_id: chef._id.toString() });
    console.log(`   🗑️ Deleted ${deletedDishes.deletedCount} dishes`);

    // Delete menu related to this chef
    const deletedMenus = await Menu.deleteMany({ chef: chef._id });
    console.log(`   🗑️ Deleted ${deletedMenus.deletedCount} menus`);

    // Delete sections related to this chef
    const deletedSections = await Section.deleteMany({ owner: chef._id });
    console.log(`   🗑️ Deleted ${deletedSections.deletedCount} sections`);

    // Delete test customers
    const deletedCustomers = await User.deleteMany({ 
      email: { $in: CUSTOMERS_DATA.map(c => c.email) }
    });
    console.log(`   🗑️ Deleted ${deletedCustomers.deletedCount} test customers`);

    // Delete the chef
    await User.deleteOne({ _id: chef._id });
    console.log('   🗑️ Deleted test chef');

    console.log('✅ Chef test data cleanup completed');
    
  } catch (error) {
    console.error('❌ Error cleaning chef test data:', error);
    throw error;
  }
}

/**
 * Display chef login credentials
 */
function displayLoginCredentials() {
  console.log(`
🔐 TEST CHEF LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    ${CHEF_TEST_DATA.email}
🔑 Password: ${CHEF_TEST_DATA.password}
👤 Username: ${CHEF_TEST_DATA.username}
📱 Phone:    ${CHEF_TEST_DATA.phone}

🍽️ RESTAURANT: ${MENU_DATA.name}
📍 Location: ${CHEF_TEST_DATA.locations[0].description}

📊 TEST DATA INCLUDES:
• ${DISHES_DATA.length} dishes across ${SECTIONS_DATA.length} categories
• 25 realistic orders with various statuses
• ${CUSTOMERS_DATA.length} test customers
• Complete menu structure with sections
• Revenue data and analytics

💡 Use these credentials to log into the app and test the Chef Dashboard!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

module.exports = {
  generateChefTestData,
  cleanChefTestData,
  displayLoginCredentials,
  CHEF_TEST_DATA
}; 