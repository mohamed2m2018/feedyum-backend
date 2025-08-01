const mongoose = require('mongoose');
const keys = require('../config/keys');

// Load models
require('../models/loadModels');
const User = mongoose.model('user');
const Address = mongoose.model('address');

// Real Egyptian addresses with accurate coordinates
const egyptianAddresses = [
  {
    nameLine: "El Tahrir Square, Downtown Cairo, Cairo Governorate",
    lat: "30.044420",
    long: "31.235712",
    city: "Cairo"
  },
  {
    nameLine: "Zamalek District, Gezira Island, Cairo Governorate", 
    lat: "30.062056",
    long: "31.220556",
    city: "Cairo"
  },
  {
    nameLine: "New Cairo, 1st Settlement, Cairo Governorate",
    lat: "30.033333",
    long: "31.433333",
    city: "Cairo"
  },
  {
    nameLine: "Heliopolis, Baron Palace Area, Cairo Governorate",
    lat: "30.108889",
    long: "31.333333",
    city: "Cairo"
  },
  {
    nameLine: "Corniche El Nil, Alexandria Governorate",
    lat: "31.205753",
    long: "29.924526",
    city: "Alexandria"
  },
  {
    nameLine: "Stanley Bridge, El Raml Station, Alexandria",
    lat: "31.214444",
    long: "29.950000",
    city: "Alexandria"
  },
  {
    nameLine: "Montaza Palace Area, Alexandria Governorate",
    lat: "31.289722",
    long: "29.948889",
    city: "Alexandria"
  },
  {
    nameLine: "El Max District, Alexandria Governorate",
    lat: "31.169722",
    long: "29.781389",
    city: "Alexandria"
  },
  {
    nameLine: "Pyramids Road, Al Haram, Giza Governorate",
    lat: "30.013056",
    long: "31.208853",
    city: "Giza"
  },
  {
    nameLine: "6th of October City, Giza Governorate",
    lat: "29.952654",
    long: "30.921919",
    city: "Giza"
  },
  {
    nameLine: "Sheikh Zayed City, Giza Governorate",
    lat: "30.056021",
    long: "30.976639",
    city: "Giza"
  },
  {
    nameLine: "Dokki District, Giza Governorate",
    lat: "30.038889",
    long: "31.212222",
    city: "Giza"
  },
  {
    nameLine: "Karnak Temple Area, Luxor Governorate",
    lat: "25.687243",
    long: "32.639637",
    city: "Luxor"
  },
  {
    nameLine: "Valley of the Kings, West Bank, Luxor",
    lat: "25.740278",
    long: "32.601389",
    city: "Luxor"
  },
  {
    nameLine: "East Bank, Luxor Temple Area, Luxor Governorate",
    lat: "25.699722",
    long: "32.639167",
    city: "Luxor"
  },
  {
    nameLine: "High Dam Area, Aswan Governorate",
    lat: "23.970278",
    long: "32.879167",
    city: "Aswan"
  },
  {
    nameLine: "Philae Temple Area, Aswan Governorate",
    lat: "24.025000",
    long: "32.884444",
    city: "Aswan"
  },
  {
    nameLine: "Corniche El Nil, Aswan City Center",
    lat: "24.088889",
    long: "32.899444",
    city: "Aswan"
  },
  {
    nameLine: "Downtown Asyut, Asyut Governorate",
    lat: "27.180134",
    long: "31.189283",
    city: "Asyut"
  },
  {
    nameLine: "University Area, Asyut Governorate",
    lat: "27.183333",
    long: "31.209722",
    city: "Asyut"
  },
  {
    nameLine: "El Mansoura University Area, Dakahlia Governorate",
    lat: "31.037933",
    long: "31.381523",
    city: "Mansoura"
  },
  {
    nameLine: "Downtown Mansoura, Dakahlia Governorate",
    lat: "31.033333",
    long: "31.366667",
    city: "Mansoura"
  },
  {
    nameLine: "Port Said Harbor Area, Port Said Governorate",
    lat: "31.256111",
    long: "32.284167",
    city: "Port Said"
  },
  {
    nameLine: "El Arab District, Port Said Governorate",
    lat: "31.276389",
    long: "32.303056",
    city: "Port Said"
  },
  {
    nameLine: "Suez Canal Authority Area, Suez Governorate",
    lat: "29.958333",
    long: "32.549444",
    city: "Suez"
  },
  {
    nameLine: "Port Tawfiq, Suez Governorate",
    lat: "29.964444",
    long: "32.565000",
    city: "Suez"
  },
  {
    nameLine: "Sohag University Area, Sohag Governorate",
    lat: "26.549999",
    long: "31.700001",
    city: "Sohag"
  },
  {
    nameLine: "Downtown Sohag, Sohag Governorate",
    lat: "26.558056",
    long: "31.695833",
    city: "Sohag"
  },
  {
    nameLine: "Marina District, Hurghada, Red Sea Governorate",
    lat: "27.246111",
    long: "33.831389",
    city: "Hurghada"
  },
  {
    nameLine: "Sekalla District, Hurghada, Red Sea Governorate",
    lat: "27.258056",
    long: "33.815278",
    city: "Hurghada"
  },
  {
    nameLine: "Naama Bay, Sharm El Sheikh, South Sinai",
    lat: "27.915278",
    long: "34.329444",
    city: "Sharm El Sheikh"
  },
  {
    nameLine: "Old Market, Sharm El Sheikh, South Sinai",
    lat: "27.858333",
    long: "34.294444",
    city: "Sharm El Sheikh"
  },
  {
    nameLine: "Damietta New City, Damietta Governorate",
    lat: "31.417540",
    long: "31.814444",
    city: "Damietta"
  },
  {
    nameLine: "Port of Damietta, Damietta Governorate",
    lat: "31.513889",
    long: "31.805556",
    city: "Damietta"
  }
];

async function updateAllUsersWithEgyptianAddresses() {
  try {
    console.log('🏺 Starting Egyptian addresses update...\n');
    
    // Connect to MongoDB
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database');
    
    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Clear all existing addresses
    console.log('\n🧹 Clearing existing addresses...');
    await Address.deleteMany({});
    console.log('✅ Cleared all existing addresses');
    
    let addressesCreated = 0;
    let usersUpdated = 0;
    let primarySet = false;
    
    console.log('\n🏺 Updating users with Egyptian addresses...');
    
    for (const user of users) {
      try {
        // Pick a random Egyptian address
        const randomAddress = egyptianAddresses[Math.floor(Math.random() * egyptianAddresses.length)];
        
        // Create new address in Address collection
        // Only set the first address as primary due to unique constraint
        const newAddress = new Address({
          nameLine: randomAddress.nameLine,
          location: {
            lat: randomAddress.lat,
            long: randomAddress.long,
          },
          isPrimary: !primarySet, // Only first address is primary
          owner: user._id,
        });
        
        await newAddress.save();
        addressesCreated++;
        
        if (!primarySet) {
          primarySet = true;
          console.log(`   🎯 Set primary address for: ${user.fullName || user.username}`);
        }
        
        // Update user's locations array (uses Numbers, not Strings)
        user.locations = [{
          description: randomAddress.nameLine,
          lat: parseFloat(randomAddress.lat),
          long: parseFloat(randomAddress.long),
        }];
        
        await user.save();
        usersUpdated++;
        
        if (usersUpdated % 10 === 0) {
          console.log(`   📍 Updated ${usersUpdated} users...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating user ${user.fullName || user.username}:`, error.message);
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Users updated: ${usersUpdated}/${users.length}`);
    console.log(`   📍 Addresses created: ${addressesCreated}`);
    console.log(`   🏛️ Cities covered: ${[...new Set(egyptianAddresses.map(a => a.city))].join(', ')}`);
    
    // Display some examples
    console.log('\n🔍 Sample updated addresses:');
    const sampleAddresses = await Address.find({}).populate('owner', 'fullName username email').limit(10);
    
    sampleAddresses.forEach((addr, index) => {
      const primaryIndicator = addr.isPrimary ? '🎯 PRIMARY' : '';
      console.log(`   ${index + 1}. ${addr.owner.fullName || addr.owner.username}: ${addr.nameLine} ${primaryIndicator}`);
      console.log(`      📍 Coordinates: ${addr.location.lat}, ${addr.location.long}`);
    });
    
    // Show distribution by city
    console.log('\n🏙️ Distribution by Egyptian cities:');
    const cityDistribution = {};
    sampleAddresses.forEach(addr => {
      const city = egyptianAddresses.find(ea => ea.nameLine === addr.nameLine)?.city || 'Unknown';
      cityDistribution[city] = (cityDistribution[city] || 0) + 1;
    });
    
    Object.entries(cityDistribution).forEach(([city, count]) => {
      console.log(`   ${city}: ${count} addresses`);
    });
    
    console.log('\n🎉 Egyptian addresses update completed successfully!');
    console.log('🏺 All users now have authentic Egyptian addresses with accurate coordinates!');
    
  } catch (error) {
    console.error('❌ Error updating addresses:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
updateAllUsersWithEgyptianAddresses(); 