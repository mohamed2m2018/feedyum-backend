const mongoose = require('mongoose');
const User = require('../models/user');
const Dish = require('../models/dish');
const mongoURI = require('../config/keys').mongoURI;

async function findChefWithDishes() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Get all chefs
    const chefs = await User.find({ type: 'chef' }).select('_id fullName email');
    
    for (const chef of chefs) {
      const dishCount = await Dish.countDocuments({ owner: chef._id });
      console.log(`${chef.fullName} (${chef.email}): ${dishCount} dishes`);
      
      if (dishCount > 0) {
        const dishes = await Dish.find({ owner: chef._id }).limit(2).select('_id name price');
        console.log('Sample dishes:', JSON.stringify(dishes, null, 2));
        console.log('Chef ID:', chef._id);
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findChefWithDishes();