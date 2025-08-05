const mongoose = require('mongoose');
const embeddingService = require('../services/embeddingService');
const keys = require('../config/keys');

// Import models
const Dish = require('../models/dish');
const User = require('../models/user');

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
    console.log('🔗 MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Regenerate ALL dish embeddings (for multilingual model)
 */
async function regenerateDishEmbeddings() {
  console.log('🍽️ Regenerating ALL dish embeddings...');
  
  try {
    // Get ALL dishes (force regenerate)
    const dishes = await Dish.find({})
      .select('+embedding +embeddingGenerated') // Explicitly include embeddings
      .limit(50); // Process in small batches first
    console.log(`Found ${dishes.length} dishes to regenerate`);

    let processed = 0;
    let errors = 0;

    for (const dish of dishes) {
      try {
        // Create searchable text
        const searchText = [
          dish.name,
          dish.description,
          dish.ingredients,
          dish.category?.join(' '),
          dish.tags?.join(' ')
        ].filter(Boolean).join(' ');

        if (searchText.trim().length > 0) {
          console.log(`Processing dish: "${dish.name || 'Untitled'}" (${searchText.substring(0, 50)}...)`);
          
          // Generate embedding with new multilingual model
          const embedding = await embeddingService.generateEmbedding(searchText);
          
          if (embedding && embedding.length > 0) {
            // Update with new embedding
            await Dish.findByIdAndUpdate(dish._id, {
              embedding: embedding,
              embeddingGenerated: new Date()
            });
            
            processed++;
            console.log(`✅ Updated dish: ${dish.name || 'Untitled'}`);
          } else {
            console.log(`⚠️ No embedding generated for dish: ${dish.name || 'Untitled'}`);
            errors++;
          }
        } else {
          console.log(`⏭️ Skipping dish with no text content: ${dish.name || 'Untitled'}`);
        }
        
        // Small delay to prevent overwhelming the system
        if (processed % 10 === 0) {
          console.log(`Progress: ${processed} dishes processed...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing dish ${dish._id}:`, error.message);
        errors++;
      }
    }

    console.log(`📊 Dishes: ${processed} processed, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('❌ Fatal error in dish embedding generation:', error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Regenerate ALL user embeddings (for multilingual model)
 */
async function regenerateUserEmbeddings() {
  console.log('👥 Regenerating ALL user embeddings...');
  
  try {
    // Get ALL users (force regenerate)
    const users = await User.find({})
      .select('+embedding +embeddingGenerated') // Explicitly include embeddings
      .limit(50); // Process in small batches first
    console.log(`Found ${users.length} users to regenerate`);

    let processed = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Create searchable text
        const searchText = [
          user.fullName,
          user.firstName,
          user.lastName,
          user.bio,
          user.specialties?.join(' '),
          user.location
        ].filter(Boolean).join(' ');

        if (searchText.trim().length > 0) {
          console.log(`Processing user: "${user.fullName || 'Unnamed'}" (${searchText.substring(0, 50)}...)`);
          
          // Generate embedding with new multilingual model
          const embedding = await embeddingService.generateEmbedding(searchText);
          
          if (embedding && embedding.length > 0) {
            // Update with new embedding
            await User.findByIdAndUpdate(user._id, {
              embedding: embedding,
              embeddingGenerated: new Date()
            });
            
            processed++;
            console.log(`✅ Updated user: ${user.fullName || 'Unnamed'}`);
          } else {
            console.log(`⚠️ No embedding generated for user: ${user.fullName || 'Unnamed'}`);
            errors++;
          }
        } else {
          console.log(`⏭️ Skipping user with no text content: ${user.fullName || 'Unnamed'}`);
        }
        
        // Small delay to prevent overwhelming the system
        if (processed % 10 === 0) {
          console.log(`Progress: ${processed} users processed...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${user._id}:`, error.message);
        errors++;
      }
    }

    console.log(`📊 Users: ${processed} processed, ${errors} errors`);
    return { processed, errors };

  } catch (error) {
    console.error('❌ Fatal error in user embedding generation:', error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 REGENERATING ALL DISH & USER EMBEDDINGS FOR MULTILINGUAL MODEL');
  console.log('=================================================================\n');

  try {
    await connectDB();
    
    // Regenerate dishes
    console.log('🍽️ Starting DISHES regeneration...\n');
    const dishStats = await regenerateDishEmbeddings();
    
    console.log('\n👥 Starting USERS regeneration...\n');
    const userStats = await regenerateUserEmbeddings();
    
    console.log('\n📊 REGENERATION SUMMARY:');
    console.log('========================');
    console.log(`Dishes: ${dishStats.processed} processed, ${dishStats.errors} errors`);
    console.log(`Users: ${userStats.processed} processed, ${userStats.errors} errors`);
    
    console.log('\n✨ Embedding regeneration completed!');
    console.log('💡 Test your Arabic search now in all categories!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
main().catch(console.error); 