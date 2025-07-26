const mongoose = require('mongoose');
const keys = require('../config/keys');

// Import all models
require('../models/loadModels');

async function unifyDatabase() {
  try {
    console.log('🔄 Starting database unification...\n');
    
    // Connect to MongoDB cluster
    const connection = await mongoose.connect(keys.mongoURI.replace('/test?', '/?'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB cluster');
    
    // Get references to both databases
    const testDb = connection.connection.client.db('test');
    const foodtokDb = connection.connection.client.db('foodtok');
    
    // List of collections to migrate
    const collectionsToMigrate = [
      'users',
      'dishes', 
      'menus',
      'sections',
      'stories',
      'categories',
      'addresses',
      'follows',
      'likes',
      'comments',
      'replies',
      'views',
      'orders',
      'carts',
      'reviews',
      'ratings',
      'chefwallets',
      'promocodes',
      'messages',
      'locations',
      'tags',
      'reportedposts',
      'randomstories'
    ];
    
    let totalMigrated = 0;
    
    for (const collectionName of collectionsToMigrate) {
      try {
        console.log(`\n📦 Migrating ${collectionName}...`);
        
        // Check if collection exists in test database
        const testCollections = await testDb.listCollections({name: collectionName}).toArray();
        if (testCollections.length === 0) {
          console.log(`   ⚠️  Collection ${collectionName} not found in test database, skipping`);
          continue;
        }
        
        // Get documents from test database
        const testCollection = testDb.collection(collectionName);
        const documents = await testCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   📭 Collection ${collectionName} is empty, skipping`);
          continue;
        }
        
        console.log(`   📊 Found ${documents.length} documents in test.${collectionName}`);
        
        // Check if collection already exists in foodtok database
        const foodtokCollection = foodtokDb.collection(collectionName);
        const existingCount = await foodtokCollection.countDocuments();
        
        if (existingCount > 0) {
          console.log(`   ⚠️  Collection ${collectionName} already has ${existingCount} documents in foodtok`);
          console.log(`   🔄 Clearing existing data and replacing with test data...`);
          await foodtokCollection.deleteMany({});
        }
        
        // Insert documents into foodtok database
        if (documents.length > 0) {
          await foodtokCollection.insertMany(documents);
          console.log(`   ✅ Migrated ${documents.length} documents to foodtok.${collectionName}`);
          totalMigrated += documents.length;
        }
        
      } catch (error) {
        console.log(`   ❌ Error migrating ${collectionName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total documents migrated: ${totalMigrated}`);
    
    // Verify the migration
    console.log(`\n🔍 Verifying migration...`);
    
    const foodtokCollections = await foodtokDb.listCollections().toArray();
    console.log(`📋 Collections in foodtok database: ${foodtokCollections.length}`);
    
    for (const collection of foodtokCollections) {
      const count = await foodtokDb.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // Test specific queries
    console.log(`\n🧪 Testing key queries...`);
    
    const usersCount = await foodtokDb.collection('users').countDocuments();
    const chefsCount = await foodtokDb.collection('users').countDocuments({type: 'chef'});
    const dishesCount = await foodtokDb.collection('dishes').countDocuments();
    const menusCount = await foodtokDb.collection('menus').countDocuments();
    
    console.log(`   👥 Users: ${usersCount} total, ${chefsCount} chefs`);
    console.log(`   🍽️  Dishes: ${dishesCount}`);
    console.log(`   📋 Menus: ${menusCount}`);
    
    // Test Alex Thompson specifically
    const alexId = '686c07e9643281d2101d66ec';
    const alexDishes = await foodtokDb.collection('dishes').countDocuments({
      user_id: new mongoose.Types.ObjectId(alexId)
    });
    console.log(`   🧑‍🍳 Alex Thompson dishes: ${alexDishes}`);
    
    if (alexDishes > 0) {
      console.log(`   ✅ Alex Thompson's dishes are now available!`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
unifyDatabase();