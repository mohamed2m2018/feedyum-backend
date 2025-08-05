const mongoose = require('mongoose');
const keys = require('../config/keys');
const User = require('../models/user');
const Order = require('../models/order');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testOrdersEndpoint() {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the Demo User specifically
    const customer = await User.findOne({ fullName: 'Demo User' });
    if (!customer) {
      console.log('❌ Demo User not found in database');
      // Try to find any customer
      const anyCustomer = await User.findOne({ type: 'customer' });
      if (!anyCustomer) {
        console.log('❌ No customer found in database');
        return;
      }
      console.log('🔍 Using customer:', anyCustomer.fullName);
      customer = anyCustomer;
    }

    console.log(`🔍 Testing with customer: ${customer.fullName} (${customer._id})`);

    // Generate JWT token for this user
    const payload = {
      id: customer._id,
      username: customer.username,
      type: customer.type
    };

    const token = jwt.sign(payload, keys.secretOrKey, { expiresIn: '1h' });
    console.log('🔑 Generated JWT token');

    // Check orders for this user in database
    const userOrders = await Order.find({ user: customer._id })
      .populate('chef', 'fullName username')
      .sort({ created_at: -1 });

    console.log(`📦 Orders in database for this user: ${userOrders.length}`);
    if (userOrders.length > 0) {
      userOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. Order #${order._id.toString().slice(-6)} - ${order.status} - $${order.totalPrice}`);
      });
    }

    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    try {
      const response = await axios.get('http://localhost:4800/api/orders/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ API Response Status:', response.status);
      console.log('📊 API Response Data:', JSON.stringify(response.data, null, 2));
    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.status, apiError.response?.data || apiError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testOrdersEndpoint();