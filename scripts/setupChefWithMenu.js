const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Section = require('../models/section');
const Dish = require('../models/dish');
const mongoURI = require('../config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to database', err));

const setupChefWithMenu = async () => {
  try {
    console.log('Setting up chef with menu...');

    // Find a user to convert to chef or create one
    let chef = await User.findOne({ email: 'chef@example.com' });
    
    if (!chef) {
      // Create a new chef user
      chef = new User({
        username: 'foodblogger',
        email: 'chef@example.com',
        fullName: 'Food Blogger',
        type: 'chef',
        bio: 'Sharing the best food spots around the city',
        hasMenu: true,
        avatar: 'https://via.placeholder.com/150',
        postsNo: 0,
        likesNo: 5,
        profileCompleted: true
      });
      await chef.save();
      console.log('✅ Created new chef user');
    } else {
      // Update existing user to be a chef
      chef.type = 'chef';
      chef.hasMenu = true;
      chef.bio = chef.bio || 'Sharing the best food spots around the city';
      await chef.save();
      console.log('✅ Updated existing user to chef');
    }

    // Check if chef already has a menu
    let menu = await Menu.findOne({ chef: chef._id });
    
    if (!menu) {
      // Create a new menu
      menu = new Menu({
        name: `${chef.fullName}'s Menu`,
        description: 'Delicious homemade dishes prepared with love',
        chef: chef._id,
        sections: []
      });
      await menu.save();
      console.log('✅ Created menu for chef');

      // Create sections
      const appetizersSection = new Section({
        name: 'Appetizers',
        description: 'Start your meal with these delicious appetizers',
        menu: menu._id,
        dishes: []
      });
      await appetizersSection.save();

      const mainCoursesSection = new Section({
        name: 'Main Courses',
        description: 'Hearty and satisfying main dishes',
        menu: menu._id,
        dishes: []
      });
      await mainCoursesSection.save();

      const dessertsSection = new Section({
        name: 'Desserts',
        description: 'Sweet treats to end your meal',
        menu: menu._id,
        dishes: []
      });
      await dessertsSection.save();

      // Create sample dishes
      const dishes = [
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with parmesan cheese and croutons',
          price: 8.99,
          section: appetizersSection._id,
          menu: menu._id,
          user_id: chef._id,
          isAvailable: true,
          image: 'https://via.placeholder.com/300x200'
        },
        {
          name: 'Grilled Chicken',
          description: 'Perfectly grilled chicken breast with herbs and spices',
          price: 15.99,
          section: mainCoursesSection._id,
          menu: menu._id,
          user_id: chef._id,
          isAvailable: true,
          image: 'https://via.placeholder.com/300x200'
        },
        {
          name: 'Chocolate Cake',
          description: 'Rich and moist chocolate cake with chocolate frosting',
          price: 6.99,
          section: dessertsSection._id,
          menu: menu._id,
          user_id: chef._id,
          isAvailable: true,
          image: 'https://via.placeholder.com/300x200'
        }
      ];

      const createdDishes = [];
      for (const dishData of dishes) {
        const dish = new Dish(dishData);
        await dish.save();
        createdDishes.push(dish);
        console.log(`✅ Created dish: ${dish.name}`);
      }

      // Update sections with dishes
      appetizersSection.dishes = [createdDishes[0]._id];
      mainCoursesSection.dishes = [createdDishes[1]._id];
      dessertsSection.dishes = [createdDishes[2]._id];

      await appetizersSection.save();
      await mainCoursesSection.save();
      await dessertsSection.save();

      // Update menu with sections and dishes
      menu.sections = [appetizersSection._id, mainCoursesSection._id, dessertsSection._id];
      menu.dishes = createdDishes.map(dish => dish._id);
      await menu.save();

      console.log('✅ Updated menu with sections and dishes');
    } else {
      console.log('✅ Chef already has a menu');
    }

    console.log('\n🎉 Setup complete!');
    console.log(`Chef ID: ${chef._id}`);
    console.log(`Chef Name: ${chef.fullName}`);
    console.log(`Menu ID: ${menu._id}`);
    console.log(`Menu Name: ${menu.name}`);
    console.log('\nYou can now test the chef profile and menu access functionality!');

  } catch (error) {
    console.error('Error setting up chef with menu:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
setupChefWithMenu();