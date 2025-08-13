const vectorSearchService = require('./vectorSearchService');
const embeddingService = require('./embeddingService');
const Dish = require('../models/dish');
const User = require('../models/user');
const Story = require('../models/story');

class PineconeDataMigration {
  constructor() {
    this.batchSize = 50; // Process in smaller batches to avoid memory issues
  }

  /**
   * Migrate all dishes to Pinecone
   */
  async migrateDishes() {
    console.log('🚀 Starting dishes migration to Pinecone...');
    
    try {
      // Get total count
      const totalCount = await Dish.countDocuments({
        visible: { $ne: false },
        embedding: { $exists: true, $ne: null }
      });

      console.log(`📊 Found ${totalCount} dishes with embeddings to migrate`);

      let processed = 0;
      let migrated = 0;

      // Process in batches
      for (let skip = 0; skip < totalCount; skip += this.batchSize) {
        const dishes = await Dish.find({
          visible: { $ne: false },
          embedding: { $exists: true, $ne: null }
        })
        .select('_id name description tags user_id embedding visible createdAt')
        .populate('user_id', 'fullName')
        .skip(skip)
        .limit(this.batchSize)
        .lean();

        if (dishes.length === 0) break;

        // Prepare vectors for Pinecone
        const vectors = dishes.map(dish => ({
          id: dish._id.toString(),
          values: dish.embedding,
          metadata: {
            name: dish.name || '',
            description: dish.description || '',
            tags: Array.isArray(dish.tags) ? dish.tags.join(' ') : '',
            chefName: dish.user_id?.fullName || '',
            chefId: dish.user_id?._id?.toString() || '',
            visible: dish.visible !== false,
            createdAt: dish.createdAt?.toISOString() || new Date().toISOString(),
            type: 'dish'
          }
        }));

        // Upsert to Pinecone
        await vectorSearchService.upsertVectors('dishes', vectors);
        
        processed += dishes.length;
        migrated += vectors.length;
        
        console.log(`✅ Migrated ${processed}/${totalCount} dishes (${Math.round(processed/totalCount*100)}%)`);
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`🎉 Dishes migration complete! Migrated ${migrated} dishes to Pinecone`);
      return { success: true, migrated };

    } catch (error) {
      console.error('❌ Dishes migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate all users to Pinecone
   */
  async migrateUsers() {
    console.log('🚀 Starting users migration to Pinecone...');
    
    try {
      const totalCount = await User.countDocuments({
        type: { $ne: "guest" },
        embedding: { $exists: true, $ne: null }
      });

      console.log(`📊 Found ${totalCount} users with embeddings to migrate`);

      let processed = 0;
      let migrated = 0;

      for (let skip = 0; skip < totalCount; skip += this.batchSize) {
        const users = await User.find({
          type: { $ne: "guest" },
          embedding: { $exists: true, $ne: null }
        })
        .select('_id fullName bio type embedding createdAt')
        .skip(skip)
        .limit(this.batchSize)
        .lean();

        if (users.length === 0) break;

        const vectors = users.map(user => ({
          id: user._id.toString(),
          values: user.embedding,
          metadata: {
            fullName: user.fullName || '',
            bio: user.bio || '',
            type: user.type || 'user',
            createdAt: user.createdAt?.toISOString() || new Date().toISOString()
          }
        }));

        await vectorSearchService.upsertVectors('users', vectors);
        
        processed += users.length;
        migrated += vectors.length;
        
        console.log(`✅ Migrated ${processed}/${totalCount} users (${Math.round(processed/totalCount*100)}%)`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`🎉 Users migration complete! Migrated ${migrated} users to Pinecone`);
      return { success: true, migrated };

    } catch (error) {
      console.error('❌ Users migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate all stories to Pinecone
   */
  async migrateStories() {
    console.log('🚀 Starting stories migration to Pinecone...');
    
    try {
      const totalCount = await Story.countDocuments({
        embedding: { $exists: true, $ne: null }
      });

      console.log(`📊 Found ${totalCount} stories with embeddings to migrate`);

      let processed = 0;
      let migrated = 0;

      for (let skip = 0; skip < totalCount; skip += this.batchSize) {
        const stories = await Story.find({
          embedding: { $exists: true, $ne: null }
        })
        .select('_id title caption author embedding reviewMode rating reviewType createdAt')
        .populate('author', 'fullName')
        .skip(skip)
        .limit(this.batchSize)
        .lean();

        if (stories.length === 0) break;

        const vectors = stories.map(story => ({
          id: story._id.toString(),
          values: story.embedding,
          metadata: {
            title: story.title || '',
            caption: story.caption || '',
            authorName: story.author?.fullName || '',
            authorId: story.author?._id?.toString() || '',
            reviewMode: story.reviewMode || false,
            rating: story.rating || null,
            reviewType: story.reviewType || null,
            createdAt: story.createdAt?.toISOString() || new Date().toISOString(),
            type: 'story'
          }
        }));

        await vectorSearchService.upsertVectors('stories', vectors);
        
        processed += stories.length;
        migrated += vectors.length;
        
        console.log(`✅ Migrated ${processed}/${totalCount} stories (${Math.round(processed/totalCount*100)}%)`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`🎉 Stories migration complete! Migrated ${migrated} stories to Pinecone`);
      return { success: true, migrated };

    } catch (error) {
      console.error('❌ Stories migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate all data types
   */
  async migrateAll() {
    console.log('🚀 Starting full migration to Pinecone...');
    
    const results = {
      dishes: { success: false, migrated: 0 },
      users: { success: false, migrated: 0 },
      stories: { success: false, migrated: 0 }
    };

    try {
      // Migrate dishes
      results.dishes = await this.migrateDishes();
      
      // Migrate users
      results.users = await this.migrateUsers();
      
      // Migrate stories
      results.stories = await this.migrateStories();

      console.log('🎉 Full migration complete!');
      console.log('📊 Migration Summary:');
      console.log(`   Dishes: ${results.dishes.migrated}`);
      console.log(`   Users: ${results.users.migrated}`);
      console.log(`   Stories: ${results.stories.migrated}`);
      
      return results;

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single dish to Pinecone (for real-time updates)
   */
  async syncDish(dishId) {
    try {
      const dish = await Dish.findById(dishId)
        .select('_id name description tags user_id embedding visible createdAt')
        .populate('user_id', 'fullName')
        .lean();

      if (!dish || !dish.embedding) {
        console.log(`⚠️ Dish ${dishId} not found or has no embedding`);
        return;
      }

      const vector = {
        id: dish._id.toString(),
        values: dish.embedding,
        metadata: {
          name: dish.name || '',
          description: dish.description || '',
          tags: Array.isArray(dish.tags) ? dish.tags.join(' ') : '',
          chefName: dish.user_id?.fullName || '',
          chefId: dish.user_id?._id?.toString() || '',
          visible: dish.visible !== false,
          createdAt: dish.createdAt?.toISOString() || new Date().toISOString(),
          type: 'dish'
        }
      };

      await vectorSearchService.upsertVectors('dishes', [vector]);
      console.log(`✅ Synced dish ${dishId} to Pinecone`);

    } catch (error) {
      console.error(`❌ Failed to sync dish ${dishId}:`, error.message);
      throw error;
    }
  }

  /**
   * Remove a dish from Pinecone
   */
  async removeDish(dishId) {
    try {
      await vectorSearchService.deleteVectors('dishes', [dishId.toString()]);
      console.log(`🗑️ Removed dish ${dishId} from Pinecone`);
    } catch (error) {
      console.error(`❌ Failed to remove dish ${dishId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new PineconeDataMigration();