require('dotenv').config();
const mongoose = require('mongoose');

async function checkEmbeddings() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to', mongoUri.split('@')[1]); // Hide password
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const dishesCol = db.collection('dishes');

    const totalDishes = await dishesCol.countDocuments();
    const dishesWithEmbeddings = await dishesCol.countDocuments({ embedding: { $exists: true, $ne: null, $not: { $size: 0 } } });

    console.log(`Total dishes: ${totalDishes}`);
    console.log(`Dishes with embeddings: ${dishesWithEmbeddings}`);
    console.log(`Dishes without embeddings: ${totalDishes - dishesWithEmbeddings}`);
    
    // Check if the semantic search fields are present in any document
    const sampleWithEmbedding = await dishesCol.findOne({ embedding: { $exists: true, $ne: null, $not: { $size: 0 } } });
    if (sampleWithEmbedding) {
        console.log(`Sample embedding exists with dimension: ${sampleWithEmbedding.embedding.length}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmbeddings();
