const mongoose = require('mongoose');
const User = require('../models/user');
const Dish = require('../models/dish');
const mongoURI = require('../config/keys').mongoURI;

async function checkOrders() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Get sample dishes
    const dishes = await Dish.find().limit(5);
    console.log('Sample dishes:');
    for (const dish of dishes) {
      const owner = await User.findById(dish.user_id);
      console.log(`- ${dish.name} ($${dish.price}) - Owner: ${owner?.fullName || 'No owner'} (${owner?.email || 'No email'}) Type: ${owner?.type || 'No type'}`);
    }
    
    // Get a dish with a valid owner
    const dish = await Dish.findOne();
    if (dish && dish.user_id) {
      const owner = await User.findById(dish.user_id);
      if (owner) {
        console.log('\nUsing this for order test:');
        console.log('Chef ID:', owner._id);
        console.log('Chef Name:', owner.fullName);
        console.log('Dish ID:', dish._id);
        console.log('Dish Name:', dish.name);
        console.log('Dish Price:', dish.price);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrders();