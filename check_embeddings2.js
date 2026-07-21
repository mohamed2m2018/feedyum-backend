require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const dishesCol = db.collection('dishes');

    const withEmbed = await dishesCol.find({ embedding: { $exists: true, $ne: null, $not: { $size: 0 } } }).limit(5).toArray();
    const withoutEmbed = await dishesCol.find({ $or: [{ embedding: { $exists: false } }, { embedding: null }, { embedding: { $size: 0 } }] }).limit(5).toArray();

    console.log("--- Dishes WITH embeddings ---");
    withEmbed.forEach(d => console.log(d.name));
    
    console.log("\n--- Dishes WITHOUT embeddings ---");
    withoutEmbed.forEach(d => console.log(d.name));
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
check();
