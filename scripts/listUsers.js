const mongoose = require('mongoose');

// Simple script to check what's in your database
async function checkDatabase() {
  const connectionStrings = [
    'mongodb://localhost:27017/foodtok',
    'mongodb://127.0.0.1:27017/foodtok',
    'mongodb://localhost:27017/makeit',
    'mongodb://localhost:27017/test',
  ];

  for (const connStr of connectionStrings) {
    try {
      console.log(`\n🔌 Trying: ${connStr}`);
      await mongoose.connect(connStr, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000,
      });

      console.log('✅ Connected!');
      
      // List all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📋 Collections: ${collections.map(c => c.name).join(', ')}`);
      
      // Try to find users
      if (collections.some(c => c.name === 'users')) {
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find({}).limit(5);
        console.log(`👥 Sample users:`);
        users.forEach(user => {
          console.log(`   - ${user.fullName || user.name || user.username || 'Unknown'} (${user.type || 'no type'})`);
        });
        
        const chefCount = await User.countDocuments({ type: 'chef' });
        console.log(`👨‍🍳 Total chefs: ${chefCount}`);
      }
      
      await mongoose.disconnect();
      return; // Success, exit
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  console.log('\n❌ Could not connect to any database');
  console.log('🔧 Try starting MongoDB:');
  console.log('   brew services start mongodb/brew/mongodb-community');
  console.log('   or');
  console.log('   sudo systemctl start mongod');
}

checkDatabase();