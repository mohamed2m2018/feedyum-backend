require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Dish = require('./models/dish');
    
    // Using Mongoose
    const mongooseDishes = await Dish.find({
        embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).select('+embedding').lean().limit(1);
    
    console.log("Mongoose embedding length:", mongooseDishes[0]?.embedding?.length);
    console.log("Mongoose dish name:", mongooseDishes[0]?.name);
    
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
testMongoose();
