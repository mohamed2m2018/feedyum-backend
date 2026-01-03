const mongoose = require('mongoose');
const Dish = require('../models/dish');
const User = require('../models/user');
const Menu = require('../models/menu');
const Section = require('../models/section');
const keys = require('../config/keys');

// Connect to MongoDB
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

const categories = [
  'Coupons', 'Homemade', 'Desserts', 'Fast food', 'Burger',
  'Chicken', 'Bakery', 'Main Courses', 'Pizza'
];

const dishesData = {
  'Coupons': [
    { name: 'Special Deal Pizza', description: 'Limited time offer - Large pizza with 3 toppings', price: 12.99, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
    { name: 'Combo Meal Deal', description: 'Burger, fries and drink combo', price: 9.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { name: 'Family Pack', description: '4 main dishes + 2 sides + dessert', price: 35.99, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' }
  ],
  'Homemade': [
    { name: 'Grandma\'s Meatloaf', description: 'Traditional homestyle meatloaf', price: 16.99, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400' },
    { name: 'Shepherd\'s Pie', description: 'Hearty meat and mashed potato pie', price: 14.50, image: 'https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?w=400' },
    { name: 'Lasagna', description: 'Rich layered pasta with meat sauce', price: 15.99, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' }
  ],
  'Desserts': [
    { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 8.99, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400' },
    { name: 'Tiramisu', description: 'Italian coffee dessert', price: 9.99, image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400' },
    { name: 'Cheesecake', description: 'New York style cheesecake', price: 7.99, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400' }
  ],
  'Fast food': [
    { name: 'Classic Cheeseburger', description: 'Beef patty with cheese', price: 8.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { name: 'Hot Dog', description: 'Grilled hot dog with mustard', price: 5.99, image: 'https://images.unsplash.com/photo-1612392062631-94dd85fa2dd0?w=400' }
  ],
  'Burger': [
    { name: 'Double Bacon Burger', description: 'Two patties with crispy bacon', price: 14.99, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400' },
    { name: 'Mushroom Swiss', description: 'Sautéed mushrooms and Swiss cheese', price: 12.99, image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400' }
  ],
  'Chicken': [
    { name: 'Grilled Chicken', description: 'Herb marinated chicken breast', price: 13.99, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400' },
    { name: 'Fried Chicken', description: 'Crispy golden fried chicken', price: 11.99, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400' }
  ],
  'Bakery': [
    { name: 'Croissant', description: 'Butter croissant', price: 3.50, image: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400' },
    { name: 'Sourdough Loaf', description: 'Freshly baked sourdough', price: 6.00, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' }
  ],
  'Main Courses': [
    { name: 'Steak Frites', description: 'Sirloin steak with fries', price: 24.99, image: 'https://images.unsplash.com/photo-1600891965056-fd943ca6f057?w=400' },
    { name: 'Salmon Glazed', description: 'Glazed salmon with rice', price: 22.99, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400' }
  ],
  'Pizza': [
    { name: 'Pepperoni Pizza', description: 'Classic pepperoni', price: 15.99, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { name: 'Veggie Pizza', description: 'Peppers, onions, mushrooms', price: 14.99, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' }
  ]
};

async function seed() {
  try {
    // 1. Find User (Chef)
    let chef = await User.findOne({ email: 'testchef@foodtok.com' });
    if (!chef) {
      console.log('Test Chef not found. Using any first available chef...');
      chef = await User.findOne({ type: 'chef' });
    }
    if (!chef) {
      throw new Error('No chef account found to attach dishes to!');
    }
    console.log(`Using Chef: ${chef.fullName} (${chef._id})`);

    // 2. Find/Create Section
    let section = await Section.findOne({ owner: chef._id });
    if (!section) {
      section = new Section({
        name: 'Main Menu',
        nameArabic: 'القائمة الرئيسية',
        description: 'General section',
        owner: chef._id
      });
      await section.save();
      console.log('Created new Section');
    }

    // 3. Find/Create Menu
    let menu = await Menu.findOne({ chef: chef._id });
    if (!menu) {
      menu = new Menu({
        name: 'Default Menu',
        chef: chef._id,
        sections: [section._id]
      });
      await menu.save();
      console.log('Created new Menu');
    }

    // 4. Create Dishes
    let count = 0;
    // Base ID number to ensure uniqueness
    let baseId = Date.now(); 
    
    // Static Menu ID for testing (since Menu model lacks it but Dish requires it)
    const STATIC_MENU_ID = 54321; 

    for (const [category, items] of Object.entries(dishesData)) {
      console.log(`Seeding category: ${category}`);
      for (const item of items) {
        
        let dish = await Dish.findOne({ name: item.name, user_id: chef._id });
        
        if (dish) {
           console.log(`  Updating existing dish: ${item.name}`);
           // Ensure tags
           if (!dish.tags.includes(category.toLowerCase())) {
             dish.tags.push(category.toLowerCase());
           }
           if (!dish.categories.includes(category)) {
             dish.categories.push(category);
           }
           
           // Ensure required fields just in case they were missing
           if (!dish.menu_id) dish.menu_id = STATIC_MENU_ID;
           if (!dish.id) dish.id = baseId++;
           
           await dish.save();
        } else {
             // New Dish
             const newId = baseId++;
             dish = new Dish({
              id: newId,
              name: item.name,
              description: item.description,
              price: item.price,
              image: item.image,
              category: category,
              categories: [category],
              user_id: chef._id,
              menu: menu._id,
              menu_id: STATIC_MENU_ID, // Explicitly set numeric menu_id
              section: section._id,
              tags: [category.toLowerCase(), category],
              average_rating: (4 + Math.random()).toFixed(1),
              visible: true,
              created_at: new Date()
            });
            await dish.save();
            count++;
            console.log(`  Added new dish: ${item.name}`);
        }
      }
    }

    // Update menu with all dish IDs found for this chef
    const allDishes = await Dish.find({ user_id: chef._id });
    menu.dishes = allDishes.map(d => d._id);
    await menu.save();
    console.log(`Updated Menu with ${menu.dishes.length} dishes.`);

    // Update Chef's hasMenu flag
    chef.hasMenu = true;
    await chef.save();

    console.log(`\n\n✅ Successfully seeded/updated dishes.`);
    console.log('You should now see them in the Explore tab.');

  } catch (err) {
    console.error('Seeding Failed:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seed();
