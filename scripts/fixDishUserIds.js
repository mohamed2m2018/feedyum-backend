const mongoose = require('mongoose');
const Dish = require('../models/dish');
const User = require('../models/user');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/makeit', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function fixDishUserIds() {
  try {
    await connectDB();
    console.log('Fixing dish user_id fields...');

    // Get all dishes
    const dishes = await Dish.find();
    console.log(`Found ${dishes.length} dishes to check`);

    let fixedCount = 0;

    for (const dish of dishes) {
      // Check if user_id is a string and needs to be converted
      if (typeof dish.user_id === 'string') {
        try {
          // Try to find the user by the string ID
          const user = await User.findById(dish.user_id);
          
          if (user) {
            // Update the dish with the ObjectId
            dish.user_id = user._id;
            await dish.save();
            console.log(`Fixed dish: ${dish.name} - User: ${user.fullName}`);
            fixedCount++;
          } else {
            console.log(`Warning: No user found for dish ${dish.name} with user_id: ${dish.user_id}`);
          }
        } catch (error) {
          console.log(`Error processing dish ${dish.name}:`, error.message);
        }
      }
    }

    console.log(`Fixed ${fixedCount} dishes`);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing dish user_ids:', error);
    process.exit(1);
  }
}

fixDishUserIds();