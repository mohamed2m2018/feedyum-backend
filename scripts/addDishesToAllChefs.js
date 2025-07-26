const mongoose = require("mongoose");
const User = require("../models/user");
const Menu = require("../models/menu");
const Dish = require("../models/dish");
const Section = require("../models/section");

// Use the same connection as your server
const mongoURI = require("../config/keys").mongoURI;

const connectDB = async () => {
  try {
    console.log("🔌 Connecting to remote MongoDB Atlas...");
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds for remote connection
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:", error.message);
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Check your internet connection");
    console.log("2. Verify MongoDB Atlas cluster is running");
    console.log("3. Check if IP address is whitelisted in Atlas");
    console.log("4. Verify database credentials are correct");
    process.exit(1);
  }
};

// Large collection of diverse dishes
const dishTemplates = [
  // Appetizers
  {
    name: "Buffalo Wings",
    description: "Spicy chicken wings with blue cheese dip",
    price: 10.99,
    category: "Appetizers",
    cookingTime: 20,
    ingredients: "Chicken wings, buffalo sauce, blue cheese, celery",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400",
  },
  {
    name: "Mozzarella Sticks",
    description: "Golden fried mozzarella with marinara sauce",
    price: 8.99,
    category: "Appetizers",
    cookingTime: 12,
    ingredients: "Mozzarella cheese, breadcrumbs, marinara sauce",
    image: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=400",
  },
  {
    name: "Loaded Nachos",
    description: "Crispy tortilla chips with cheese, jalapeños, and sour cream",
    price: 11.99,
    category: "Appetizers",
    cookingTime: 15,
    ingredients: "Tortilla chips, cheese, jalapeños, sour cream, guacamole",
    image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400",
  },
  {
    name: "Crispy Calamari",
    description: "Fresh squid rings served with marinara sauce",
    price: 12.99,
    category: "Appetizers",
    cookingTime: 15,
    ingredients: "Squid, flour, marinara sauce, lemon, herbs",
    image: "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=400",
  },
  {
    name: "Spinach Artichoke Dip",
    description: "Creamy dip with spinach and artichokes, served hot",
    price: 9.99,
    category: "Appetizers",
    cookingTime: 18,
    ingredients: "Spinach, artichokes, cream cheese, parmesan, tortilla chips",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  },

  // Main Course
  {
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon herb butter and vegetables",
    price: 24.99,
    category: "Main Course",
    cookingTime: 25,
    ingredients: "Salmon fillet, lemon, herbs, butter, seasonal vegetables",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
  },
  {
    name: "Ribeye Steak",
    description: "Premium ribeye steak with garlic mashed potatoes",
    price: 32.99,
    category: "Main Course",
    cookingTime: 30,
    ingredients: "Ribeye steak, potatoes, garlic, butter, herbs",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
  },
  {
    name: "Chicken Parmesan",
    description: "Breaded chicken breast with marinara and mozzarella",
    price: 19.99,
    category: "Main Course",
    cookingTime: 35,
    ingredients: "Chicken breast, breadcrumbs, marinara, mozzarella, pasta",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
  },
  {
    name: "BBQ Ribs",
    description: "Slow-cooked pork ribs with BBQ sauce and coleslaw",
    price: 26.99,
    category: "Main Course",
    cookingTime: 120,
    ingredients: "Pork ribs, BBQ sauce, coleslaw, corn bread",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
  },
  {
    name: "Fish and Chips",
    description: "Beer-battered cod with crispy fries and tartar sauce",
    price: 18.99,
    category: "Main Course",
    cookingTime: 25,
    ingredients: "Cod fillet, beer batter, potatoes, tartar sauce",
    image: "https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400",
  },
  {
    name: "Lamb Chops",
    description: "Herb-crusted lamb chops with mint sauce",
    price: 29.99,
    category: "Main Course",
    cookingTime: 28,
    ingredients: "Lamb chops, herbs, mint sauce, roasted vegetables",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
  },

  // Pasta
  {
    name: "Spaghetti Carbonara",
    description: "Classic Italian pasta with eggs, cheese, and pancetta",
    price: 16.99,
    category: "Pasta",
    cookingTime: 20,
    ingredients: "Spaghetti, eggs, parmesan, pancetta, black pepper",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400",
  },
  {
    name: "Fettuccine Alfredo",
    description: "Creamy alfredo sauce with fettuccine pasta",
    price: 15.99,
    category: "Pasta",
    cookingTime: 18,
    ingredients: "Fettuccine, heavy cream, parmesan, butter, garlic",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400",
  },
  {
    name: "Penne Arrabbiata",
    description: "Spicy tomato sauce with penne pasta and herbs",
    price: 14.99,
    category: "Pasta",
    cookingTime: 22,
    ingredients: "Penne pasta, tomatoes, chili peppers, garlic, basil",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400",
  },
  {
    name: "Lasagna",
    description: "Layered pasta with meat sauce, ricotta, and mozzarella",
    price: 18.99,
    category: "Pasta",
    cookingTime: 45,
    ingredients:
      "Lasagna sheets, ground beef, ricotta, mozzarella, tomato sauce",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400",
  },

  // Pizza
  {
    name: "Margherita Pizza",
    description: "Classic pizza with tomato, mozzarella, and basil",
    price: 14.99,
    category: "Pizza",
    cookingTime: 15,
    ingredients: "Pizza dough, tomato sauce, mozzarella, fresh basil",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400",
  },
  {
    name: "Pepperoni Pizza",
    description: "Traditional pepperoni pizza with mozzarella cheese",
    price: 16.99,
    category: "Pizza",
    cookingTime: 15,
    ingredients: "Pizza dough, tomato sauce, mozzarella, pepperoni",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
  },
  {
    name: "Supreme Pizza",
    description: "Loaded pizza with pepperoni, sausage, peppers, and mushrooms",
    price: 19.99,
    category: "Pizza",
    cookingTime: 18,
    ingredients:
      "Pizza dough, pepperoni, sausage, bell peppers, mushrooms, onions",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
  },
  {
    name: "Hawaiian Pizza",
    description: "Pizza with ham, pineapple, and mozzarella cheese",
    price: 17.99,
    category: "Pizza",
    cookingTime: 15,
    ingredients: "Pizza dough, ham, pineapple, mozzarella, tomato sauce",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
  },

  // Burgers
  {
    name: "Classic Cheeseburger",
    description: "Beef patty with cheese, lettuce, tomato, and pickles",
    price: 13.99,
    category: "Burgers",
    cookingTime: 15,
    ingredients: "Beef patty, cheese, lettuce, tomato, pickles, burger bun",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
  },
  {
    name: "Bacon Burger",
    description: "Juicy burger with crispy bacon and cheddar cheese",
    price: 15.99,
    category: "Burgers",
    cookingTime: 18,
    ingredients: "Beef patty, bacon, cheddar cheese, lettuce, tomato",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400",
  },
  {
    name: "Veggie Burger",
    description: "Plant-based patty with avocado and sprouts",
    price: 12.99,
    category: "Burgers",
    cookingTime: 12,
    ingredients: "Veggie patty, avocado, sprouts, lettuce, tomato",
    image: "https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400",
  },

  // Salads
  {
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with caesar dressing and croutons",
    price: 11.99,
    category: "Salads",
    cookingTime: 10,
    ingredients: "Romaine lettuce, caesar dressing, croutons, parmesan",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
  },
  {
    name: "Greek Salad",
    description: "Fresh vegetables with feta cheese and olives",
    price: 10.99,
    category: "Salads",
    cookingTime: 8,
    ingredients: "Mixed greens, feta cheese, olives, tomatoes, cucumber",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
  },
  {
    name: "Cobb Salad",
    description: "Mixed greens with chicken, bacon, and blue cheese",
    price: 14.99,
    category: "Salads",
    cookingTime: 12,
    ingredients: "Mixed greens, grilled chicken, bacon, blue cheese, eggs",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  },

  // Desserts
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center and vanilla ice cream",
    price: 8.99,
    category: "Desserts",
    cookingTime: 12,
    ingredients: "Dark chocolate, butter, eggs, flour, vanilla ice cream",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
  },
  {
    name: "Cheesecake",
    description: "New York style cheesecake with berry compote",
    price: 7.99,
    category: "Desserts",
    cookingTime: 5,
    ingredients: "Cream cheese, graham crackers, berries, sugar",
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400",
  },
  {
    name: "Apple Pie",
    description: "Classic apple pie with cinnamon and vanilla ice cream",
    price: 6.99,
    category: "Desserts",
    cookingTime: 8,
    ingredients: "Apples, cinnamon, pie crust, vanilla ice cream",
    image: "https://images.unsplash.com/photo-1535920527002-b35e96722da9?w=400",
  },
  {
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee and mascarpone",
    price: 7.99,
    category: "Desserts",
    cookingTime: 5,
    ingredients: "Ladyfingers, coffee, mascarpone, cocoa powder",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
  },

  // Beverages
  {
    name: "Fresh Lemonade",
    description: "Freshly squeezed lemon juice with mint",
    price: 4.99,
    category: "Beverages",
    cookingTime: 5,
    ingredients: "Fresh lemons, sugar, water, mint leaves",
    image: "https://images.unsplash.com/photo-1523371683702-af5338c08c2d?w=400",
  },
  {
    name: "Iced Coffee",
    description: "Cold brew coffee with milk and vanilla syrup",
    price: 5.99,
    category: "Beverages",
    cookingTime: 3,
    ingredients: "Coffee beans, milk, vanilla syrup, ice",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
  },
  {
    name: "Smoothie Bowl",
    description: "Acai smoothie bowl with fresh fruits and granola",
    price: 9.99,
    category: "Beverages",
    cookingTime: 8,
    ingredients: "Acai, banana, berries, granola, coconut",
    image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400",
  },
];

async function addDishesToAllChefs() {
  try {
    console.log("🚀 Adding dishes to ALL chefs in database...");

    // Find ALL chef users
    const chefs = await User.find({ type: "chef" }).select(
      "_id fullName username"
    );
    console.log(`👨‍🍳 Found ${chefs.length} chefs in database`);

    if (chefs.length === 0) {
      console.log("❌ No chefs found in database.");
      return;
    }

    let menusCreated = 0;
    let sectionsCreated = 0;
    let dishesCreated = 0;

    for (const chef of chefs) {
      console.log(`\n👨‍🍳 Processing chef: ${chef.fullName} (${chef._id})`);

      // Check if chef already has a menu
      let menu = await Menu.findOne({ chef: chef._id });

      if (!menu) {
        // Create menu for chef
        menu = new Menu({
          name: `${chef.fullName}'s Kitchen`,
          description: `Delicious dishes crafted by ${chef.fullName}`,
          chef: chef._id, // Use 'chef' field as required by Menu model
          sections: [], // Initialize empty sections array
          created_at: new Date(),
        });

        await menu.save();
        menusCreated++;
        console.log(`✅ Created menu for ${chef.fullName}`);
      } else {
        console.log(`📋 Menu already exists for ${chef.fullName}`);
      }

      // Create sections for the menu
      const sectionsToCreate = [
        "Appetizers",
        "Main Course",
        "Pasta",
        "Pizza",
        "Burgers",
        "Salads",
        "Desserts",
        "Beverages",
      ];
      const createdSections = {};

      for (const sectionName of sectionsToCreate) {
        let section = await Section.findOne({
          name: sectionName,
          owner: chef._id,
        });

        if (!section) {
          section = new Section({
            name: sectionName,
            description: `${sectionName} by ${chef.fullName}`,
            owner: chef._id,
            created_at: new Date(),
          });

          await section.save();
          sectionsCreated++;
          console.log(`📁 Created section: ${sectionName}`);
        }

        createdSections[sectionName] = section._id;
      }

      // Check existing dishes for this chef
      const existingDishes = await Dish.find({ user_id: chef._id.toString() });
      console.log(`📊 Chef has ${existingDishes.length} existing dishes`);

      // Always add dishes, even if chef has some (to ensure good variety)
      const targetDishCount = 12; // Target number of dishes per chef
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
            owner: chef._id,
          });

          if (!existingDish) {
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
            console.log(
              `🍽️  Added dish: ${dishData.name} ($${dishData.price})`
            );
          }
        }
      } else {
        console.log(
          `✅ Chef already has sufficient dishes (${existingDishes.length})`
        );
      }

      // Show final count for this chef
      const finalDishCount = await Dish.countDocuments({
        user_id: chef._id.toString(),
      });
      console.log(`📊 ${chef.fullName} now has ${finalDishCount} total dishes`);
    }

    console.log("\n🎉 Dish addition completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Chefs processed: ${chefs.length}`);
    console.log(`   - Menus created: ${menusCreated}`);
    console.log(`   - Sections created: ${sectionsCreated}`);
    console.log(`   - Dishes added: ${dishesCreated}`);

    // Final verification
    console.log("\n🔍 Final verification:");
    for (const chef of chefs.slice(0, 5)) {
      // Show first 5 chefs
      const dishCount = await Dish.countDocuments({ owner: chef._id });
      console.log(`   - ${chef.fullName}: ${dishCount} dishes`);
    }

    if (chefs.length > 5) {
      console.log(`   ... and ${chefs.length - 5} more chefs with dishes`);
    }
  } catch (error) {
    console.error("❌ Error adding dishes to chefs:", error);
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
