const mongoose = require('mongoose');
const Story = require('../models/story');
const Dish = require('../models/dish');
const User = require('../models/user');
const mongoURI = require('../config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to database', err));

const attachDishesToStories = async () => {
  try {
    console.log('Attaching dishes to stories...');

    // Find all chef users
    const chefs = await User.find({ type: 'chef' }).select('_id fullName');
    console.log(`Found ${chefs.length} chefs`);

    for (const chef of chefs) {
      console.log(`\nProcessing chef: ${chef.fullName} (${chef._id})`);
      
      // Find dishes by this chef
      const dishes = await Dish.find({ 
        $or: [
          { user_id: chef._id },
          { chef: chef._id },
          { owner: chef._id }
        ]
      }).select('_id name');
      
      console.log(`  Found ${dishes.length} dishes for this chef`);
      
      if (dishes.length === 0) {
        console.log('  No dishes found, skipping...');
        continue;
      }

      // Find stories by this chef that don't have dishes attached
      const stories = await Story.find({ 
        author: chef._id,
        $or: [
          { dishes: { $exists: false } },
          { dishes: { $size: 0 } }
        ]
      }).select('_id title');
      
      console.log(`  Found ${stories.length} stories without dishes`);
      
      if (stories.length === 0) {
        console.log('  All stories already have dishes attached');
        continue;
      }

      // Attach random dishes to each story
      for (const story of stories) {
        // Randomly select 1-3 dishes
        const numDishesToAttach = Math.floor(Math.random() * 3) + 1;
        const shuffledDishes = dishes.sort(() => 0.5 - Math.random());
        const selectedDishes = shuffledDishes.slice(0, Math.min(numDishesToAttach, dishes.length));
        
        // Update the story with attached dishes
        await Story.findByIdAndUpdate(story._id, {
          dishes: selectedDishes.map(dish => dish._id)
        });
        
        console.log(`    Attached ${selectedDishes.length} dishes to story "${story.title}"`);
        console.log(`      Dishes: ${selectedDishes.map(d => d.name).join(', ')}`);
      }
    }

    console.log('\n✅ Successfully attached dishes to stories!');
    console.log('\nNow reels will show "View in Menu" buttons that scroll to the attached dishes.');

  } catch (error) {
    console.error('❌ Error attaching dishes to stories:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
attachDishesToStories();