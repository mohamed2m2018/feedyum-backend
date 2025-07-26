const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Section = require('../models/section');
const Order = require('../models/order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/foodtok', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleChefs = [
  {
    fullName: 'Mario Giuseppe',
    username: 'mario_chef',
    email: 'mario@foodtok.com',
    password: 'password123',
    type: 'chef',
    profileCompleted: true,
    phone: '1234567890',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=200',
    bio: 'Authentic Italian cuisine with a modern twist',
  },
  {
    fullName: 'Isabella Rodriguez',
    username: 'bella_chef',
    email: 'isabella@foodtok.com',
    password: 'password123',
    type: 'chef',
    profileCompleted: true,
    phone: '1234567891',
    avatar: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=200',
    bio: 'Spanish and Mediterranean flavors',
  },
  {
    fullName: 'Chen Wei',
    username: 'chen_chef',
    email: 'chen@foodtok.com',
    password: 'password123',
    type: 'chef',
    profileCompleted: true,
    phone: '1234567892',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200',
    bio: 'Traditional Asian cuisine and fusion dishes',
  },
  {
    fullName: 'Ahmed Hassan',
    username: 'ahmed_chef',
    email: 'ahmed@foodtok.com',
    password: 'password123',
    type: 'chef',
    profileCompleted: true,
    phone: '1234567893',
    avatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91b?w=200',
    bio: 'Middle Eastern and Mediterranean specialties',
  },
  {
    fullName: 'Sophie Laurent',
    username: 'sophie_chef',
    email: 'sophie@foodtok.com',
    password: 'password123',
    type: 'chef',
    profileCompleted: true,
    phone: '1234567894',
    avatar: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=200',
    bio: 'French pastry and fine dining',
  },
];

const sampleUsers = [
  {
    fullName: 'John Smith',
    username: 'john_user',
    email: 'john@foodtok.com',
    password: 'password123',
    type: 'user',
    profileCompleted: true,
    phone: '1234567895',
  },
  {
    fullName: 'Sarah Johnson',
    username: 'sarah_user',
    email: 'sarah@foodtok.com',
    password: 'password123',
    type: 'user',
    profileCompleted: true,
    phone: '1234567896',
  },
];

const dishTemplates = {
  'Mario Giuseppe': [
    {
      name: 'Spaghetti Carbonara',
      description: 'Classic Roman pasta with eggs, cheese, pancetta, and black pepper',
      price: 18.99,
      category: 'Pasta',
      cookingTime: 20,
      ingredients: 'Spaghetti, eggs, pecorino romano, pancetta, black pepper',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
    },
    {
      name: 'Margherita Pizza',
      description: 'Traditional Neapolitan pizza with tomato, mozzarella, and fresh basil',
      price: 16.99,
      category: 'Pizza',
      cookingTime: 15,
      ingredients: 'Pizza dough, San Marzano tomatoes, mozzarella di bufala, fresh basil',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
    },
    {
      name: 'Osso Buco',
      description: 'Braised veal shanks with vegetables, white wine and broth',
      price: 32.99,
      category: 'Main Course',
      cookingTime: 120,
      ingredients: 'Veal shanks, carrots, celery, onions, white wine, beef broth',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
      price: 8.99,
      category: 'Desserts',
      cookingTime: 30,
      ingredients: 'Ladyfingers, espresso, mascarpone, eggs, sugar, cocoa powder',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    },
  ],
  'Isabella Rodriguez': [
    {
      name: 'Paella Valenciana',
      description: 'Traditional Spanish rice dish with chicken, rabbit, and vegetables',
      price: 24.99,
      category: 'Main Course',
      cookingTime: 45,
      ingredients: 'Bomba rice, chicken, rabbit, green beans, garrofó, saffron',
      image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400',
    },
    {
      name: 'Patatas Bravas',
      description: 'Crispy potatoes with spicy tomato sauce and aioli',
      price: 9.99,
      category: 'Appetizers',
      cookingTime: 25,
      ingredients: 'Potatoes, tomato sauce, paprika, garlic, olive oil',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    },
    {
      name: 'Gazpacho',
      description: 'Cold Spanish soup made with fresh vegetables',
      price: 7.99,
      category: 'Soups',
      cookingTime: 15,
      ingredients: 'Tomatoes, cucumber, bell pepper, onion, garlic, olive oil',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    },
  ],
  'Chen Wei': [
    {
      name: 'Kung Pao Chicken',
      description: 'Spicy stir-fried chicken with peanuts and vegetables',
      price: 16.99,
      category: 'Main Course',
      cookingTime: 20,
      ingredients: 'Chicken, peanuts, vegetables, chili peppers, soy sauce',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    },
    {
      name: 'Xiaolongbao',
      description: 'Steamed soup dumplings with pork filling',
      price: 12.99,
      category: 'Appetizers',
      cookingTime: 30,
      ingredients: 'Pork, ginger, scallions, dumpling wrapper, broth',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400',
    },
    {
      name: 'Mapo Tofu',
      description: 'Spicy Sichuan tofu dish with ground pork',
      price: 14.99,
      category: 'Main Course',
      cookingTime: 25,
      ingredients: 'Silken tofu, ground pork, doubanjiang, Sichuan peppercorns',
      image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400',
    },
  ],
  'Ahmed Hassan': [
    {
      name: 'Lamb Shawarma',
      description: 'Slow-cooked lamb with Middle Eastern spices',
      price: 19.99,
      category: 'Main Course',
      cookingTime: 35,
      ingredients: 'Lamb, tahini, garlic, lemon, pita bread, vegetables',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
    },
    {
      name: 'Hummus Platter',
      description: 'Creamy chickpea dip with olive oil and pita',
      price: 8.99,
      category: 'Appetizers',
      cookingTime: 10,
      ingredients: 'Chickpeas, tahini, lemon juice, garlic, olive oil',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    },
    {
      name: 'Baklava',
      description: 'Sweet pastry with nuts and honey syrup',
      price: 6.99,
      category: 'Desserts',
      cookingTime: 45,
      ingredients: 'Phyllo dough, walnuts, pistachios, honey, butter',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    },
  ],
  'Sophie Laurent': [
    {
      name: 'Coq au Vin',
      description: 'Classic French chicken braised in red wine',
      price: 26.99,
      category: 'Main Course',
      cookingTime: 90,
      ingredients: 'Chicken, red wine, bacon, mushrooms, pearl onions',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
    },
    {
      name: 'Crème Brûlée',
      description: 'Rich vanilla custard with caramelized sugar top',
      price: 9.99,
      category: 'Desserts',
      cookingTime: 60,
      ingredients: 'Heavy cream, vanilla, egg yolks, sugar',
      image: 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=400',
    },
    {
      name: 'French Onion Soup',
      description: 'Classic soup with caramelized onions and Gruyère cheese',
      price: 11.99,
      category: 'Soups',
      cookingTime: 60,
      ingredients: 'Onions, beef broth, Gruyère cheese, baguette, thyme',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    },
  ],
};

async function createTestData() {
  try {
    console.log('🚀 Creating comprehensive test data...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ type: { $in: ['chef', 'user'] } });
    // await Menu.deleteMany({});
    // await Dish.deleteMany({});
    // await Section.deleteMany({});
    // await Order.deleteMany({});
    
    const createdChefs = [];
    const createdUsers = [];
    
    // Create chefs
    console.log('\n👨‍🍳 Creating chefs...');
    for (const chefData of sampleChefs) {
      let chef = await User.findOne({ email: chefData.email });
      
      if (!chef) {
        const hashedPassword = await bcrypt.hash(chefData.password, 10);
        chef = new User({
          ...chefData,
          password: hashedPassword,
        });
        await chef.save();
        console.log(`✅ Created chef: ${chef.fullName}`);
      } else {
        console.log(`👨‍🍳 Chef already exists: ${chef.fullName}`);
      }
      
      createdChefs.push(chef);
    }
    
    // Create regular users
    console.log('\n👤 Creating users...');
    for (const userData of sampleUsers) {
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        user = new User({
          ...userData,
          password: hashedPassword,
        });
        await user.save();
        console.log(`✅ Created user: ${user.fullName}`);
      } else {
        console.log(`👤 User already exists: ${user.fullName}`);
      }
      
      createdUsers.push(user);
    }
    
    // Create menus and dishes for each chef
    console.log('\n📋 Creating menus and dishes...');
    for (const chef of createdChefs) {
      // Create menu
      let menu = await Menu.findOne({ owner: chef._id });
      
      if (!menu) {
        menu = new Menu({
          name: `${chef.fullName}'s Kitchen`,
          description: chef.bio || `Delicious dishes by ${chef.fullName}`,
          owner: chef._id,
          created_at: new Date(),
        });
        await menu.save();
        console.log(`📋 Created menu for ${chef.fullName}`);
      }
      
      // Create sections
      const categories = ['Appetizers', 'Main Course', 'Pasta', 'Pizza', 'Soups', 'Desserts'];
      const sections = {};
      
      for (const category of categories) {
        let section = await Section.findOne({ name: category, owner: chef._id });
        
        if (!section) {
          section = new Section({
            name: category,
            description: `${category} by ${chef.fullName}`,
            owner: chef._id,
            created_at: new Date(),
          });
          await section.save();
        }
        
        sections[category] = section._id;
      }
      
      // Create dishes
      const chefDishes = dishTemplates[chef.fullName] || [];
      
      for (const dishData of chefDishes) {
        let dish = await Dish.findOne({ name: dishData.name, owner: chef._id });
        
        if (!dish) {
          dish = new Dish({
            ...dishData,
            owner: chef._id,
            menu: menu._id,
            section: sections[dishData.category],
            visible: true,
            average_rating: Math.random() * 2 + 3, // 3-5 stars
            created_at: new Date(),
          });
          await dish.save();
          console.log(`🍽️  Created dish: ${dishData.name} for ${chef.fullName}`);
        }
      }
    }
    
    // Create sample orders
    console.log('\n📦 Creating sample orders...');
    for (let i = 0; i < 5; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomChef = createdChefs[Math.floor(Math.random() * createdChefs.length)];
      
      // Get dishes from this chef
      const chefDishes = await Dish.find({ owner: randomChef._id }).limit(3);
      
      if (chefDishes.length > 0) {
        const orderItems = chefDishes.slice(0, Math.floor(Math.random() * 3) + 1).map(dish => ({
          dish: dish._id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: dish.price,
          total: dish.price * (Math.floor(Math.random() * 3) + 1),
        }));
        
        const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
        
        const order = new Order({
          user: randomUser._id,
          chef: randomChef._id,
          items: orderItems,
          totalAmount,
          serviceFee: totalAmount * 0.02,
          deliveryFee: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 3 : 0,
          finalTotal: totalAmount + (totalAmount * 0.02) + (Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 3 : 0),
          status: ['pending', 'accepted', 'preparing', 'ready'][Math.floor(Math.random() * 4)],
          deliveryAddress: {
            street: '123 Main St',
            city: 'Sample City',
            state: 'Sample State',
            zipCode: '12345',
          },
          notes: 'Sample order for testing',
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        });
        
        await order.save();
        console.log(`📦 Created order from ${randomUser.fullName} to ${randomChef.fullName}`);
      }
    }
    
    // Summary
    const totalChefs = await User.countDocuments({ type: 'chef' });
    const totalMenus = await Menu.countDocuments();
    const totalDishes = await Dish.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    console.log('\n🎉 Test data creation completed!');
    console.log('📊 Summary:');
    console.log(`   - Chefs: ${totalChefs}`);
    console.log(`   - Menus: ${totalMenus}`);
    console.log(`   - Dishes: ${totalDishes}`);
    console.log(`   - Orders: ${totalOrders}`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('Chefs:');
    sampleChefs.forEach(chef => {
      console.log(`   - ${chef.email} / ${chef.password}`);
    });
    console.log('Users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} / ${user.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createTestData();