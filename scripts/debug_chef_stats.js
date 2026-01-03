const axios = require('axios');

const API_URL = 'http://192.168.1.104:4800/api';

async function testChefStats() {
  try {
    // 1. Login as testchef
    console.log('Logging in as testchef...');
    const loginRes = await axios.post(`${API_URL}/user/login`, {
      email: 'testchef@foodtok.com',
      password: 'TestUser123!'
    });

    const token = loginRes.data.token;
    console.log('Login successful, token received.');

    // 2. Get Stats
    console.log('Fetching Chef Stats...');
    const statsRes = await axios.get(`${API_URL}/orders/chef/stats`, {
      headers: { Authorization: token }
    });

    console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      // Try another password if login failed
      if (error.response.status === 400 || error.response.status === 404) {
         console.log('Retrying with password 123456...');
         try {
            const loginRes2 = await axios.post(`${API_URL}/user/login`, {
              email: 'testchef@test.com',
              password: '123456'
            });
            const token2 = loginRes2.data.token;
            console.log('Login successful with 123456.');
             const statsRes2 = await axios.get(`${API_URL}/orders/chef/stats`, {
              headers: { Authorization: token2 }
            });
            console.log('Stats Response:', JSON.stringify(statsRes2.data, null, 2));
         } catch (e2) {
             console.error('Retry failed:', e2.message);
         }
      }
    } else {
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
    }
  }
}

testChefStats();
