const mongoose = require('mongoose');
const embeddingService = require('../services/embeddingService');
const keys = require('../config/keys');

// Import models
const Dish = require('../models/dish');
const User = require('../models/user');
const Story = require('../models/story');

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Generate embeddings for dishes
 */
async function generateDishEmbeddings() {
  console.log('Starting dish embeddings generation...');
  
  try {
    // Get dishes without embeddings
    const dishes = await Dish.find({
      $or: [
        { embedding: null },
        { embedding: { $exists: false } },
        { embeddingGenerated: null },
        { embeddingGenerated: { $exists: false } }
      ]
    })
    .select('+embedding +embeddingGenerated') // Explicitly include embeddings to check their status
    .limit(100); // Process in batches

    console.log(`Found ${dishes.length} dishes to process`);

    let processed = 0;
    let errors = 0;

    for (const dish of dishes) {
      try {
        // Prepare text for embedding
        const text = embeddingService.prepareTextForEmbedding(dish, [
          'name',
          'description',
          'category',
          'tags',
          'ingredients',
          'dietaryInfo'
        ]);

        if (!text || text.trim().length === 0) {
          console.log(`Skipping dish ${dish._id} - no text content`);
          continue;
        }

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(text);
        
        if (embedding) {
          // Update dish with embedding
          await Dish.findByIdAndUpdate(dish._id, {
            embedding: embedding,
            embeddingGenerated: new Date()
          });
          processed++;
          console.log(`✅ Generated embedding for dish: ${dish.name} (${processed}/${dishes.length})`);
        } else {
          console.log(`⚠️ Failed to generate embedding for dish: ${dish.name}`);
          errors++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing dish ${dish._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\nDish embeddings completed: ${processed} successful, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('Error in generateDishEmbeddings:', error);
    throw error;
  }
}

/**
 * Generate embeddings for users
 */
async function generateUserEmbeddings() {
  console.log('Starting user embeddings generation...');
  
  try {
    // Get users without embeddings
    const users = await User.find({
      $or: [
        { embedding: null },
        { embedding: { $exists: false } },
        { embeddingGenerated: null },
        { embeddingGenerated: { $exists: false } }
      ],
      type: { $ne: 'guest' }
    })
    .select('+embedding +embeddingGenerated') // Explicitly include embeddings to check their status
    .limit(100); // Process in batches

    console.log(`Found ${users.length} users to process`);

    let processed = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Prepare text for embedding
        const text = embeddingService.prepareTextForEmbedding(user, [
          'fullName',
          'username',
          'bio',
          'type'
        ]);

        if (!text || text.trim().length === 0) {
          console.log(`Skipping user ${user._id} - no text content`);
          continue;
        }

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(text);
        
        if (embedding) {
          // Update user with embedding
          await User.findByIdAndUpdate(user._id, {
            embedding: embedding,
            embeddingGenerated: new Date()
          });
          processed++;
          console.log(`✅ Generated embedding for user: ${user.fullName || user.username} (${processed}/${users.length})`);
        } else {
          console.log(`⚠️ Failed to generate embedding for user: ${user.fullName || user.username}`);
          errors++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing user ${user._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\nUser embeddings completed: ${processed} successful, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('Error in generateUserEmbeddings:', error);
    throw error;
  }
}

/**
 * Generate embeddings for stories
 */
async function generateStoryEmbeddings() {
  console.log('Starting story embeddings generation...');
  
  try {
    // Get stories without embeddings
    const stories = await Story.find({
      $or: [
        { embedding: null },
        { embedding: { $exists: false } },
        { embeddingGenerated: null },
        { embeddingGenerated: { $exists: false } }
      ]
    })
    .select('+embedding +embeddingGenerated') // Explicitly include embeddings to check their status
    .limit(100); // Process in batches

    console.log(`Found ${stories.length} stories to process`);

    let processed = 0;
    let errors = 0;

    for (const story of stories) {
      try {
        // Prepare text for embedding
        const text = embeddingService.prepareTextForEmbedding(story, [
          'title',
          'caption',
          'description'
        ]);

        if (!text || text.trim().length === 0) {
          console.log(`Skipping story ${story._id} - no text content`);
          continue;
        }

        // Generate embedding
        const embedding = await embeddingService.generateEmbedding(text);
        
        if (embedding) {
          // Update story with embedding
          await Story.findByIdAndUpdate(story._id, {
            embedding: embedding,
            embeddingGenerated: new Date()
          });
          processed++;
          console.log(`✅ Generated embedding for story: ${story.title || story.caption || story._id} (${processed}/${stories.length})`);
        } else {
          console.log(`⚠️ Failed to generate embedding for story: ${story.title || story.caption || story._id}`);
          errors++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing story ${story._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\nStory embeddings completed: ${processed} successful, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('Error in generateStoryEmbeddings:', error);
    throw error;
  }
}

/**
 * Main function to run the embedding generation
 */
async function main() {
  console.log('🚀 Starting embedding generation process...\n');

  try {
    await connectDB();

    const totalStats = {
      dishes: { processed: 0, errors: 0 },
      users: { processed: 0, errors: 0 },
      stories: { processed: 0, errors: 0 }
    };

    // Generate embeddings for each type
    if (process.argv.includes('--dishes') || process.argv.includes('--all')) {
      totalStats.dishes = await generateDishEmbeddings();
    }

    if (process.argv.includes('--users') || process.argv.includes('--all')) {
      totalStats.users = await generateUserEmbeddings();
    }

    if (process.argv.includes('--stories') || process.argv.includes('--all')) {
      totalStats.stories = await generateStoryEmbeddings();
    }

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`Dishes: ${totalStats.dishes.processed} processed, ${totalStats.dishes.errors} errors`);
    console.log(`Users: ${totalStats.users.processed} processed, ${totalStats.users.errors} errors`);
    console.log(`Stories: ${totalStats.stories.processed} processed, ${totalStats.stories.errors} errors`);
    
    const totalProcessed = totalStats.dishes.processed + totalStats.users.processed + totalStats.stories.processed;
    const totalErrors = totalStats.dishes.errors + totalStats.users.errors + totalStats.stories.errors;
    
    console.log(`\nTotal: ${totalProcessed} processed, ${totalErrors} errors`);
    console.log('\n✨ Embedding generation completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Handle script arguments
if (process.argv.length === 2) {
  console.log('Usage: node generateEmbeddings.js [--all | --dishes | --users | --stories]');
  console.log('Example: node generateEmbeddings.js --all');
  process.exit(0);
}

// Run the script
main().catch(console.error); 