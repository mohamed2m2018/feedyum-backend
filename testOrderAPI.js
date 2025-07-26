const mongoose = require('mongoose');
const keys = require('./config/keys');

// Load all models
require('./models/order');
require('./models/user');
require('./models/dish');
require('./models/menu');

const Order = mongoose.model('order');
const User = mongoose.model('user');

const testOrderAPI = async () => {
  try {
    console.log('🔍 Testing Order API...');
    
    // Connect to database
    await mongoose.connect(keys.mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get a test order
    const testOrder = await Order.findOne()
      .populate('user', 'fullName username avatar email phone')
      .populate('chef', 'fullName username avatar email phone')
      .populate('items.dish', 'name price image description');

    if (!testOrder) {
      console.log('❌ No orders found in database');
      return;
    }

    console.log('📋 Test Order Found:');
    console.log(`   ID: ${testOrder._id}`);
    console.log(`   Status: ${testOrder.status}`);
    console.log(`   Chef: ${testOrder.chef?.fullName || testOrder.chef?.username || 'Unknown'}`);
    console.log(`   Customer: ${testOrder.user?.fullName || testOrder.user?.username || 'Unknown'}`);
    console.log(`   Items: ${testOrder.items?.length || 0}`);
    console.log(`   Total: $${testOrder.totalPrice || 0}`);
    console.log(`   Created: ${testOrder.created_at}`);

    // Test the API endpoint structure
    console.log('\n🔧 API Response Structure:');
    console.log(JSON.stringify({
      _id: testOrder._id,
      status: testOrder.status,
      chef: testOrder.chef,
      user: testOrder.user,
      items: testOrder.items,
      totalPrice: testOrder.totalPrice,
      subtotal: testOrder.subtotal,
      deliveryFee: testOrder.deliveryFee,
      deliveryAddress: testOrder.deliveryAddress,
      specialInstructions: testOrder.specialInstructions,
      created_at: testOrder.created_at
    }, null, 2));

    // Get a test user for authentication
    const testUser = await User.findOne({ type: { $ne: 'chef' } });
    if (testUser) {
      console.log('\n👤 Test User for Authentication:');
      console.log(`   ID: ${testUser._id}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Name: ${testUser.fullName || testUser.username}`);
    }

    mongoose.disconnect();
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
    mongoose.disconnect();
  }
};

testOrderAPI();