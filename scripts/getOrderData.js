const mongoose = require('mongoose');
const User = require('../models/user');
const Dish = require('../models/dish');
const mongoURI = require('../config/keys').mongoURI;

async function getOrderData() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Get a chef
    const chef = await User.findOne({ type: 'chef' }).select('_id fullName email');
    console.log('Chef:', JSON.stringify(chef, null, 2));
    
    // Get some dishes from this chef
    const dishes = await Dish.find({ owner: chef._id }).limit(2).select('_id name price owner');
    console.log('Dishes:', JSON.stringify(dishes, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

getOrderData();