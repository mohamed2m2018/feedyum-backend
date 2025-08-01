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

// Categories from discover routes
const categories = [
  'Coupons',
  'Homemade', 
  'Desserts',
  'Fast food',
  'Burger',
  'Chicken',
  'Bakery',
  'Main Courses',
  'Pizza'
];

// Sample dishes for each category
const dishesData = {
  'Coupons': [
    {
      name: 'Special Deal Pizza',
      description: 'Limited time offer - Large pizza with 3 toppings',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
    },
    {
      name: 'Combo Meal Deal',
      description: 'Burger, fries and drink combo at special price',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
    },
    {
      name: 'Family Pack Special',
      description: '4 main dishes + 2 sides + dessert family deal',
      price: 35.99,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
    }
  ],
  'Homemade': [
    {
      name: 'Grandma\'s Meatloaf',
      description: 'Traditional homestyle meatloaf with mashed potatoes',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
    },
    {
      name: 'Home-style Chicken Soup',
      description: 'Comforting chicken soup made from scratch',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400'
    },
    {
      name: 'Mom\'s Apple Pie',
      description: 'Classic homemade apple pie with cinnamon',
      price: 6.99,
      image: 'https://images.unsplash.com/photo-1535920527002-b35e96722da9?w=400'
    },
    {
      name: 'Homemade Lasagna',
      description: 'Layered pasta with meat sauce and cheese',
      price: 18.99,
      image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400'
    }
  ],
  'Desserts': [
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400'
    },
    {
      name: 'New York Cheesecake',
      description: 'Classic creamy cheesecake with berry compote',
      price: 7.99,
      image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400'
    },
    {
      name: 'Tiramisu',
      description: 'Italian coffee-flavored dessert with mascarpone',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'
    },
    {
      name: 'Crème Brûlée',
      description: 'French vanilla custard with caramelized sugar',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=400'
    }
  ],
  'Fast food': [
    {
      name: 'Classic Cheeseburger',
      description: 'Beef patty with cheese, lettuce, tomato, pickles',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
    },
    {
      name: 'Crispy Chicken Sandwich',
      description: 'Fried chicken breast with mayo and lettuce',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e2013afd?w=400'
    },
    {
      name: 'French Fries',
      description: 'Golden crispy potato fries with sea salt',
      price: 4.99,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'
    },
    {
      name: 'Fish & Chips',
      description: 'Beer-battered fish with crispy fries',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
    }
  ],
  'Burger': [
    {
      name: 'Big Beef Burger',
      description: 'Double beef patty with bacon and cheese',
      price: 14.99,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
    },
    {
      name: 'Veggie Burger',
      description: 'Plant-based patty with avocado and sprouts',
      price: 11.99,
      image: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400'
    },
    {
      name: 'BBQ Bacon Burger',
      description: 'Beef patty with BBQ sauce, bacon, and onion rings',
      price: 13.99,
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400'
    },
    {
      name: 'Mushroom Swiss Burger',
      description: 'Beef patty with sautéed mushrooms and Swiss cheese',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400'
    }
  ],
  'Chicken': [
    {
      name: 'Grilled Chicken Breast',
      description: 'Herb-marinated grilled chicken with vegetables',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400'
    },
    {
      name: 'Buffalo Chicken Wings',
      description: 'Spicy buffalo wings with ranch dressing',
      price: 11.99,
      image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400'
    },
    {
      name: 'Chicken Parmesan',
      description: 'Breaded chicken with marinara and mozzarella',
      price: 18.99,
      image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400'
    },
    {
      name: 'Chicken Caesar Salad',
      description: 'Grilled chicken over romaine with Caesar dressing',
      price: 13.99,
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'
    }
  ],
  'Bakery': [
    {
      name: 'Fresh Croissants',
      description: 'Buttery, flaky French croissants baked daily',
      price: 3.99,
      image: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400'
    },
    {
      name: 'Artisan Sourdough Bread',
      description: 'Traditional sourdough bread with crispy crust',
      price: 5.99,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'
    },
    {
      name: 'Chocolate Chip Muffins',
      description: 'Soft muffins loaded with chocolate chips',
      price: 4.99,
      image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400'
    },
    {
      name: 'Danish Pastries',
      description: 'Assorted Danish pastries with fruit and cream',
      price: 6.99,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400'
    }
  ],
  'Main Courses': [
    {
      name: 'Grilled Salmon',
      description: 'Atlantic salmon with lemon herb butter',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400'
    },
    {
      name: 'Beef Tenderloin',
      description: 'Prime beef tenderloin with red wine reduction',
      price: 32.99,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
    },
    {
      name: 'Lamb Chops',
      description: 'Herb-crusted lamb chops with mint sauce',
      price: 28.99,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'
    },
    {
      name: 'Seafood Paella',
      description: 'Spanish rice dish with mixed seafood',
      price: 26.99,
      image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400'
    }
  ],
  'Pizza': [
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato, mozzarella, and basil',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400'
    },
    {
      name: 'Pepperoni Pizza',
      description: 'Traditional pepperoni pizza with mozzarella',
      price: 18.99,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
    },
    {
      name: 'Supreme Pizza',
      description: 'Loaded with pepperoni, sausage, peppers, mushrooms',
      price: 22.99,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
    },
    {
      name: 'Hawaiian Pizza',
      description: 'Ham and pineapple with mozzarella cheese',
      price: 19.99,
      image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400'
    }
  ]
};

async function addDishesToCategories() {
  try {
    console.log('Starting to add dishes to categories...');

    // Get all chefs
    const chefs = await User.find({ type: 'chef' }).limit(10);
    console.log(`Found ${chefs.length} chefs`);

    if (chefs.length === 0) {
      console.log('No chefs found in database');
      return;
    }

    // Get menus for these chefs
    const menus = await Menu.find({ 
      chef: { $in: chefs.map(chef => chef._id) } 
    });
    console.log(`Found ${menus.length} menus`);

    let dishCounter = Date.now();
    let totalDishesAdded = 0;

    for (const category of categories) {
      console.log(`\nAdding dishes for category: ${category}`);
      const categoryDishes = dishesData[category] || [];
      
      for (const dishData of categoryDishes) {
        // Randomly assign to different chefs and menus
        const randomChef = chefs[Math.floor(Math.random() * chefs.length)];
        const chefMenus = menus.filter(menu => menu.chef.toString() === randomChef._id.toString());
        
        if (chefMenus.length === 0) {
          console.log(`No menu found for chef ${randomChef.fullName}, skipping...`);
          continue;
        }

        const randomMenu = chefMenus[Math.floor(Math.random() * chefMenus.length)];

        const newDish = new Dish({
          id: dishCounter++,
          name: dishData.name,
          description: dishData.description,
          category: category,
          price: dishData.price,
          menu: randomMenu._id,
          menu_id: randomMenu.menu_id || Math.floor(Math.random() * 1000000),
          user_id: randomChef._id,
          visible: true,
          average_rating: Math.random() * 2 + 3, // Random rating between 3-5
          image: dishData.image,
          ingredients: [],
          tags: [category.toLowerCase()],
          dietaryInfo: [],
          created_at: new Date()
        });

        await newDish.save();
        totalDishesAdded++;
        console.log(`Added: ${dishData.name} to ${randomChef.fullName}'s menu`);
      }
    }

    console.log(`\n✅ Successfully added ${totalDishesAdded} dishes across ${categories.length} categories`);
    console.log('Categories populated:');
    categories.forEach(cat => {
      const count = dishesData[cat]?.length || 0;
      console.log(`  - ${cat}: ${count} dishes`);
    });

  } catch (error) {
    console.error('Error adding dishes:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
addDishesToCategories();