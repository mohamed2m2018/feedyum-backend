const mongoose = require('mongoose');

// Test different connection strings
const connectionStrings = [
  'mongodb://localhost:27017/foodtok',
  'mongodb://127.0.0.1:27017/foodtok',
  'mongodb://localhost:27017/test',
  'mongodb://localhost:27017/makeit',
  'mongodb://localhost:27017/food-app',
];

async function testConnections() {
  console.log('🔍 Testing MongoDB connections...\n');
  
  for (const connectionString of connectionStrings) {
    try {
      console.log(`Testing: ${connectionString}`);
      await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000,
      });
      
      console.log('✅ Connection successful!');
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📋 Collections found: ${collections.map(c => c.name).join(', ')}`);
      
      // Check for users
      const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
      const userCount = await User.countDocuments();
      console.log(`👥 Users in database: ${userCount}`);
      
      await mongoose.disconnect();
      console.log(`\n🎯 Use this connection string: ${connectionString}\n`);
      return;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  console.log('\n❌ No working connections found.');
  console.log('🔧 Make sure MongoDB is running:');
  console.log('   brew services start mongodb/brew/mongodb-community');
  console.log('   or');
  console.log('   sudo systemctl start mongod');
}

testConnections();