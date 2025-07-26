const mongoose = require('mongoose');
const keys = require('../config/keys');

async function findCorrectDatabase() {
  try {
    // Connect without specifying database
    const connection = await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB cluster');
    
    // Get the admin database to list all databases
    const admin = connection.connection.db.admin();
    const databasesList = await admin.listDatabases();
    
    console.log('Available databases:');
    databasesList.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Test each database for dishes collection
    for (const dbInfo of databasesList.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') {
        continue; // Skip system databases
      }
      
      console.log(`\nChecking database: ${dbInfo.name}`);
      
      try {
        const db = connection.connection.client.db(dbInfo.name);
        const collections = await db.listCollections().toArray();
        
        const hasUsers = collections.some(col => col.name === 'users');
        const hasDishes = collections.some(col => col.name === 'dishes');
        const hasMenus = collections.some(col => col.name === 'menus');
        
        console.log(`  Collections: users=${hasUsers}, dishes=${hasDishes}, menus=${hasMenus}`);
        
        if (hasDishes) {
          const dishesCollection = db.collection('dishes');
          const dishCount = await dishesCollection.countDocuments();
          console.log(`  Dishes count: ${dishCount}`);
          
          if (dishCount > 0) {
            // Get a sample dish
            const sampleDish = await dishesCollection.findOne();
            console.log(`  Sample dish: ${sampleDish.name} (user_id: ${sampleDish.user_id})`);
            
            // Check for Alex Thompson's dishes
            const alexId = '686c07e9643281d2101d66ec';
            const alexDishCount = await dishesCollection.countDocuments({
              user_id: new mongoose.Types.ObjectId(alexId)
            });
            console.log(`  Alex Thompson dishes: ${alexDishCount}`);
          }
        }
      } catch (error) {
        console.log(`  Error checking ${dbInfo.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

findCorrectDatabase();