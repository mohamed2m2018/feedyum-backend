const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const keys = require('./config/keys');

// Load models
require('./models/user');
require('./models/order');
require('./models/dish');
require('./models/menu');

const User = mongoose.model('user');
const Order = mongoose.model('order');

const testAuth = async () => {
  try {
    console.log('🔐 Testing Authentication...');
    
    // Connect to database
    await mongoose.connect(keys.mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get a test user
    const testUser = await User.findOne({ email: 'guest@foodtok.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Test User:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.fullName || testUser.username}`);

    // Get an order for this user
    const userOrder = await Order.findOne({ user: testUser._id })
      .populate('user', 'fullName username avatar email phone')
      .populate('chef', 'fullName username avatar email phone')
      .populate('items.dish', 'name price image description');

    if (userOrder) {
      console.log('\n📋 User Order:');
      console.log(`   ID: ${userOrder._id}`);
      console.log(`   Status: ${userOrder.status}`);
      console.log(`   Total: $${userOrder.totalPrice}`);
    } else {
      console.log('\n❌ No orders found for this user');
    }

    // Test order endpoint without auth
    console.log('\n🌐 Testing API endpoint...');
    const axios = require('axios');
    
    try {
      const response = await axios.get(`http://localhost:4800/api/orders/${userOrder._id}`);
      console.log('✅ API call successful (no auth required?)');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ API call failed (auth required)');
      console.log('Error:', error.response?.status, error.response?.statusText);
      console.log('This is expected - authentication is required');
    }

    mongoose.disconnect();
    console.log('\n✅ Auth test completed');

  } catch (error) {
    console.error('❌ Auth test failed:', error);
    mongoose.disconnect();
  }
};

testAuth();