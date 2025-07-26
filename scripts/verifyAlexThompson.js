const mongoose = require('mongoose');
const keys = require('../config/keys');

async function verifyAlexThompson() {
  try {
    console.log('🔍 Verifying Alex Thompson data...\n');
    
    // Connect to foodtok database
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to foodtok database');
    
    const db = mongoose.connection.db;
    
    // Find Alex Thompson user
    const usersCollection = db.collection('users');
    const alexUsers = await usersCollection.find({
      $or: [
        { fullName: /Alex.*Thompson/i },
        { fullName: /Thompson.*Alex/i },
        { username: /alex/i }
      ]
    }).toArray();
    
    console.log(`👤 Found ${alexUsers.length} users matching Alex Thompson:`);
    alexUsers.forEach(user => {
      console.log(`   - ${user.fullName} (${user._id}) - Type: ${user.type}`);
    });
    
    if (alexUsers.length === 0) {
      console.log('❌ No Alex Thompson found in users collection');
      return;
    }
    
    // Check dishes for each Alex user
    const dishesCollection = db.collection('dishes');
    
    for (const alex of alexUsers) {
      console.log(`\n🍽️  Checking dishes for ${alex.fullName} (${alex._id}):`);
      
      // Try different query approaches
      const dishes1 = await dishesCollection.find({ user_id: alex._id }).toArray();
      const dishes2 = await dishesCollection.find({ user_id: alex._id.toString() }).toArray();
      const dishes3 = await dishesCollection.find({ user_id: new mongoose.Types.ObjectId(alex._id) }).toArray();
      
      console.log(`   - Query with ObjectId: ${dishes1.length} dishes`);
      console.log(`   - Query with string: ${dishes2.length} dishes`);
      console.log(`   - Query with new ObjectId: ${dishes3.length} dishes`);
      
      if (dishes1.length > 0) {
        console.log(`   ✅ Found dishes! Sample: ${dishes1[0].name} ($${dishes1[0].price})`);
      }
    }
    
    // Check all dishes to see user_id patterns
    console.log(`\n📊 Analyzing all dishes...`);
    const allDishes = await dishesCollection.find({}).limit(10).toArray();
    
    console.log('Sample dishes with user_ids:');
    allDishes.forEach((dish, index) => {
      console.log(`   ${index + 1}. ${dish.name} - user_id: ${dish.user_id} (type: ${typeof dish.user_id})`);
    });
    
    // Get unique user_ids from dishes
    const uniqueUserIds = await dishesCollection.distinct('user_id');
    console.log(`\n🔑 Unique user_ids in dishes: ${uniqueUserIds.length}`);
    
    // Match user_ids with actual users
    for (const userId of uniqueUserIds.slice(0, 5)) { // Check first 5
      const user = await usersCollection.findOne({ _id: userId });
      const dishCount = await dishesCollection.countDocuments({ user_id: userId });
      console.log(`   - ${user?.fullName || 'Unknown'} (${userId}): ${dishCount} dishes`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

verifyAlexThompson();