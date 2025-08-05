const mongoose = require('mongoose');
const keys = require('../config/keys');
const User = require('../models/user');
const axios = require('axios');

async function testWithLogin() {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find Demo User
    const demoUser = await User.findOne({ fullName: 'Demo User' });
    if (!demoUser) {
      console.log('❌ Demo User not found');
      return;
    }

    console.log(`🔍 Found Demo User: ${demoUser.username}`);

    // Try to login (we need to know the password)
    // Let's check what the password might be
    console.log('🔑 Demo User details:');
    console.log('   Username:', demoUser.username);
    console.log('   Email:', demoUser.email);
    
    // Try the known demo password
    const testPasswords = ['Demo123!', 'password', 'demo', 'test', '123456', 'demouser'];
    
    let token = null;
    for (const password of testPasswords) {
      try {
        console.log(`🔐 Trying password: ${password}`);
        const loginResponse = await axios.post('http://localhost:4800/api/user/login', {
          email: demoUser.email,
          password: password
        });
        
        if (loginResponse.data.success && loginResponse.data.token) {
          token = loginResponse.data.token;
          console.log('✅ Login successful!');
          break;
        }
      } catch (loginError) {
        console.log(`❌ Password ${password} failed`);
      }
    }

    if (!token) {
      console.log('❌ Could not login with any test password');
      return;
    }

    // Test the orders endpoint with the valid token
    console.log('\n🌐 Testing orders endpoint with valid token...');
    try {
      const response = await axios.get('http://localhost:4800/api/orders/user', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Orders API Response Status:', response.status);
      console.log('📊 Orders API Response:', JSON.stringify(response.data, null, 2));
    } catch (apiError) {
      console.log('❌ Orders API Error:', apiError.response?.status, apiError.response?.data || apiError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testWithLogin();