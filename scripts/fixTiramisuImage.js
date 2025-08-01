const mongoose = require('mongoose');
const keys = require('../config/keys');

// Import models
const Dish = require('../models/dish');
const User = require('../models/user');
const Story = require('../models/story');

const fixTiramisuImage = async () => {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(keys.mongoURI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find Alex Thompson user
    const alexThompson = await User.findOne({ 
      $or: [
        { fullName: /Alex Thompson/i },
        { username: /alex.*thompson/i }
      ]
    });

    if (!alexThompson) {
      console.log('Alex Thompson user not found');
      // Update all Tiramisu dishes without images
      const result = await Dish.updateMany(
        { 
          name: /Tiramisu/i, 
          $or: [
            { image: { $exists: false } },
            { image: null },
            { image: '' },
            { image: /picsum\.photos/ }  // Also update picsum.photos URLs
          ]
        },
        { 
          $set: { 
            image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'
          } 
        }
      );
      console.log(`Updated ${result.modifiedCount} Tiramisu dishes without images`);
    } else {
      // Update Alex Thompson's Tiramisu specifically
      const result = await Dish.updateMany(
        { 
          name: /Tiramisu/i,
          user_id: alexThompson._id,
          $or: [
            { image: { $exists: false } },
            { image: null },
            { image: '' },
            { image: /picsum\.photos/ }  // Also update picsum.photos URLs
          ]
        },
        { 
          $set: { 
            image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'
          } 
        }
      );
      console.log(`Updated ${result.modifiedCount} Tiramisu dish(es) for Alex Thompson`);
    }

    // Also update poster field in stories
    console.log('\n📖 Updating Tiramisu story posters...');
    
    const storyResult = await Story.updateMany(
      { 
        title: /Tiramisu/i,
        $or: [
          { poster: { $exists: false } },
          { poster: null },
          { poster: '' },
          { poster: /picsum\.photos/ }  // Also update picsum.photos URLs
        ]
      },
      { 
        $set: { 
          poster: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'
        } 
      }
    );
    console.log(`Updated ${storyResult.modifiedCount} Tiramisu story poster(s)`);

    // Verify the updates
    const updatedDishes = await Dish.find({ 
      name: /Tiramisu/i 
    }).populate('user_id', 'fullName username');

    const updatedStories = await Story.find({ 
      title: /Tiramisu/i 
    }).populate('author', 'fullName username');

    console.log('\n📊 Updated Tiramisu dishes:');
    updatedDishes.forEach(dish => {
      console.log(`- ${dish.name} by ${dish.user_id?.fullName || dish.user_id?.username}`);
      console.log(`  Image: ${dish.image}`);
      console.log(`  Price: $${dish.price}`);
      console.log('---');
    });

    console.log('\n📖 Updated Tiramisu stories:');
    updatedStories.forEach(story => {
      console.log(`- ${story.title} by ${story.author?.fullName || story.author?.username}`);
      console.log(`  Poster: ${story.poster}`);
      console.log(`  Price: ${story.price}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error fixing Tiramisu image:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
fixTiramisuImage(); 