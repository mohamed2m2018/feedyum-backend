require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Dish = require('./models/dish');
    
    // Using Mongoose
    const mongooseDishes = await Dish.find({
        embedding: { $exists: true, $ne: null }
    }).select('+embedding').lean().limit(1);
    
    console.log("Mongoose embedding length:", mongooseDishes[0]?.embedding?.length);
    if (mongooseDishes[0]?.embedding) {
        console.log("Mongoose embedding type:", typeof mongooseDishes[0].embedding, Array.isArray(mongooseDishes[0].embedding));
    }
    
    // Using Native Driver
    const nativeDishes = await mongoose.connection.db.collection('dishes').find({
        embedding: { $exists: true, $ne: null }
    }).limit(1).toArray();
    
    console.log("Native embedding length:", nativeDishes[0]?.embedding?.length);

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
testMongoose();
