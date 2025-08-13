const axios = require('axios');

// Test the discover batch endpoint performance
async function testDiscoverPerformance() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';
  const testCoordinates = [
    { lat: 30.033, long: 31.233, name: 'Cairo' },
    { lat: 24.7136, long: 46.6753, name: 'Riyadh' },
    { lat: 25.2048, long: 55.2708, name: 'Dubai' },
  ];
  
  console.log('🚀 Testing Discover Batch Performance...\n');
  
  for (const coord of testCoordinates) {
    console.log(`📍 Testing ${coord.name} (${coord.lat}, ${coord.long})`);
    
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${baseURL}/api/discover/batch`, {
        params: {
          lat: coord.lat,
          long: coord.long,
          userId: '507f1f77bcf86cd799439011' // Test user ID
        },
        timeout: 10000 // 10 second timeout
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const serverTime = response.data.loadTime;
      const networkTime = totalTime - serverTime;
      
      console.log(`✅ Success!`);
      console.log(`   Server Time: ${serverTime}ms`);
      console.log(`   Network Time: ${networkTime}ms`);
      console.log(`   Total Time: ${totalTime}ms`);
      console.log(`   Cached: ${response.data.cached ? 'Yes' : 'No'}`);
      
      // Count data returned
      const data = response.data.data;
      let totalUsers = 0;
      let totalDishes = 0;
      
      Object.keys(data).forEach(category => {
        totalUsers += data[category].users?.length || 0;
        totalDishes += data[category].dishes?.length || 0;
      });
      
      console.log(`   Categories: ${Object.keys(data).length}`);
      console.log(`   Total Users: ${totalUsers}`);
      console.log(`   Total Dishes: ${totalDishes}`);
      
      // Performance rating
      if (totalTime < 100) {
        console.log(`   Rating: 🚀 EXCELLENT (${totalTime}ms)`);
      } else if (totalTime < 500) {
        console.log(`   Rating: ✅ GOOD (${totalTime}ms)`);
      } else if (totalTime < 1000) {
        console.log(`   Rating: ⚠️ ACCEPTABLE (${totalTime}ms)`);
      } else {
        console.log(`   Rating: ❌ SLOW (${totalTime}ms)`);
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎯 Performance test completed!');
}

// Run the test
testDiscoverPerformance().catch(console.error);