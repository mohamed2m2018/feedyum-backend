const axios = require('axios');

async function debugAuth() {
  try {
    // Test the /user endpoint first
    console.log('🔍 Testing /user endpoint...');
    
    try {
      const userResponse = await axios.get('http://localhost:4800/api/user', {
        timeout: 5000
      });
      console.log('✅ /user endpoint works:', userResponse.status);
      console.log('📊 User data:', JSON.stringify(userResponse.data, null, 2));
    } catch (userError) {
      if (userError.response) {
        console.log('❌ /user endpoint error:', userError.response.status, userError.response.data);
      } else {
        console.log('❌ /user endpoint error:', userError.message);
      }
    }

    // Test the /orders/user endpoint
    console.log('\n🔍 Testing /orders/user endpoint...');
    
    try {
      const ordersResponse = await axios.get('http://localhost:4800/api/orders/user', {
        timeout: 5000
      });
      console.log('✅ /orders/user endpoint works:', ordersResponse.status);
      console.log('📊 Orders data:', JSON.stringify(ordersResponse.data, null, 2));
    } catch (ordersError) {
      if (ordersError.response) {
        console.log('❌ /orders/user endpoint error:', ordersError.response.status, ordersError.response.data);
      } else {
        console.log('❌ /orders/user endpoint error:', ordersError.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugAuth();