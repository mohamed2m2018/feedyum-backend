require('dotenv').config();
const mongoose = require('mongoose');
const embeddingService = require('../services/embeddingService');
const Dish = require('../models/dish');

async function run() {
  try {
    console.log(`Connecting to MongoDB: ${process.env.MONGO_URI.split('@')[1]}`);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find dishes lacking embeddings or having empty ones => $or
    const dishes = await Dish.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } }
      ]
    });

    console.log(`Found ${dishes.length} dishes needing embeddings.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      try {
        const text = embeddingService.prepareTextForEmbedding(dish, [
          'name',
          'description',
          'category',
          'categories',
          'tags',
          'ingredients',
          'dietaryInfo'
        ]);

        if (text && text.trim().length > 0) {
          const embedding = await embeddingService.generateEmbedding(text);
          
          if (embedding) {
            await Dish.findByIdAndUpdate(dish._id, {
              embedding: embedding,
              embeddingGenerated: new Date()
            }, { strict: false }); // ensure we can save even if schema has it as select: false
            
            successCount++;
            console.log(`[${i+1}/${dishes.length}] ✅ Generated embedding for: ${dish.name}`);
          } else {
            failCount++;
            console.log(`[${i+1}/${dishes.length}] ⚠️ Failed to generate embedding for: ${dish.name}`);
          }
        } else {
          console.log(`[${i+1}/${dishes.length}] ⏭️ Skipped (no text) for: ${dish.name}`);
        }
      } catch (err) {
        failCount++;
        console.error(`[${i+1}/${dishes.length}] ❌ Error processing dish ${dish.name}:`, err.message);
      }
      
      // small delay to prevent rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n🎉 Finished! Success: ${successCount}, Failed: ${failCount}`);

  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

run();
