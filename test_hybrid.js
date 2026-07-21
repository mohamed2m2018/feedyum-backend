require('dotenv').config();
const mongoose = require('mongoose');
const semanticSearchService = require('./services/semanticSearchService');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Testing hybrid search for 'burger'...");
    
    // We mock the controllers inside semanticSearchService for fallbackTextSearch
    // So if it falls back to text search, we should see it
    const options = { limit: 10, page: 1 };
    
    // 1. Let's run just semantic
    const sem = await semanticSearchService.searchDishes('burger', options);
    console.log("SEMANTIC ALONE RESULTS:");
    console.log(sem.data?.dishes?.map(d => d.name));

    // 2. Hybrid
    const result = await semanticSearchService.hybridSearch('dishes', 'burger', options);
    
    console.log("HYBRID RESULTS:");
    console.log(JSON.stringify(result.data.dishes.map(d => ({
        name: d.name,
        searchSource: d.searchSource,
        semanticScore: d.semanticScore || null
    })), null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
test();
