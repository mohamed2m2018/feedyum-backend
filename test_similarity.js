require('dotenv').config();
const mongoose = require('mongoose');
const embeddingService = require('./services/embeddingService');
const SemanticSearchService = require('./services/semanticSearchService');

async function testSimilarity() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Generate embedding for "burger"
    console.log("Generating embedding for 'burger'...");
    const queryEmbedding = await embeddingService.generateQueryEmbedding('burger');
    
    // Get the burger dish
    const dishesCol = db.collection('dishes');
    const burgerDish = await dishesCol.findOne({ name: "Burger Sandwich (for testing only)", embedding: { $exists: true } });
    
    if (burgerDish && burgerDish.embedding && queryEmbedding) {
        // SemanticSearchService usually does this
        const similarity = embeddingService.calculateCosineSimilarity(queryEmbedding, burgerDish.embedding);
        console.log(`Cosine similarity for 'burger' vs '${burgerDish.name}': ${similarity}`);
    } else {
        console.log("Could not find dish or generate embedding.");
    }

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
testSimilarity();
