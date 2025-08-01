const mongoose = require('mongoose');
const keys = require('../config/keys');

// Load models
require('../models/loadModels');
const User = mongoose.model('user');
const Address = mongoose.model('address');

async function verifyEgyptianAddresses() {
  try {
    console.log('🔍 Verifying Egyptian addresses in database...\n');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get all users with their locations
    const users = await User.find({}).select('fullName username email locations');
    console.log(`👥 Found ${users.length} users in database`);
    
    // Get all addresses
    const addresses = await Address.find({}).populate('owner', 'fullName username email');
    console.log(`📍 Found ${addresses.length} addresses in database`);
    
    // Check users with Egyptian locations
    console.log('\n🏺 Users with Egyptian locations:');
    let usersWithLocations = 0;
    
    users.forEach((user, index) => {
      if (user.locations && user.locations.length > 0) {
        usersWithLocations++;
        const location = user.locations[0];
        console.log(`   ${index + 1}. ${user.fullName || user.username}`);
        console.log(`      📍 ${location.description}`);
        console.log(`      🗺️  Coordinates: ${location.lat}, ${location.long}\n`);
      }
    });
    
    console.log(`📊 Users with locations: ${usersWithLocations}/${users.length}`);
    
    // Check Address collection
    console.log('\n🏠 Address Collection Details:');
    if (addresses.length > 0) {
      addresses.forEach((addr, index) => {
        const primaryIndicator = addr.isPrimary ? '🎯 PRIMARY' : '';
        console.log(`   ${index + 1}. ${addr.owner.fullName || addr.owner.username}: ${addr.nameLine} ${primaryIndicator}`);
        console.log(`      📍 Coordinates: ${addr.location.lat}, ${addr.location.long}\n`);
      });
      
      // Count addresses by Egyptian cities
      const egyptianCities = ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Asyut', 'Mansoura', 'Port Said', 'Suez', 'Sohag', 'Hurghada', 'Sharm El Sheikh', 'Damietta'];
      const cityCount = {};
      
      addresses.forEach(addr => {
        const addressText = addr.nameLine.toLowerCase();
        egyptianCities.forEach(city => {
          if (addressText.includes(city.toLowerCase())) {
            cityCount[city] = (cityCount[city] || 0) + 1;
          }
        });
      });
      
      console.log('🏙️ Distribution by Egyptian cities:');
      Object.entries(cityCount).forEach(([city, count]) => {
        console.log(`   ${city}: ${count} addresses`);
      });
      
      // Check coordinate ranges for Egypt
      const latitudes = addresses.map(addr => parseFloat(addr.location.lat));
      const longitudes = addresses.map(addr => parseFloat(addr.location.long));
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLong = Math.min(...longitudes);
      const maxLong = Math.max(...longitudes);
      
      console.log('\n📏 Coordinate ranges:');
      console.log(`   Latitude: ${minLat.toFixed(6)} to ${maxLat.toFixed(6)}`);
      console.log(`   Longitude: ${minLong.toFixed(6)} to ${maxLong.toFixed(6)}`);
      
      // Egypt's approximate bounds: 22°N to 31.5°N, 25°E to 35°E
      const validLatRange = minLat >= 22 && maxLat <= 32;
      const validLongRange = minLong >= 25 && maxLong <= 35;
      
      if (validLatRange && validLongRange) {
        console.log('   ✅ All coordinates are within Egypt\'s geographical bounds');
      } else {
        console.log('   ⚠️  Some coordinates may be outside Egypt\'s bounds');
      }
      
    } else {
      console.log('   ❌ No addresses found in Address collection');
    }
    
    console.log('\n🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying addresses:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the verification
verifyEgyptianAddresses(); 