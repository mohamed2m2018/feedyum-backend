const axios = require('axios');

// Quick test to see if the endpoint responds
async function quickTest() {
  try {
    const response = await axios.get('http://localhost:4800/api/orders/user', {
      timeout: 5000
    });
    console.log('✅ Response received:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

quickTest();