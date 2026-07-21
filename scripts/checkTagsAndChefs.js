const mongoose = require('mongoose');
const User = require('../models/user');
const ChefWallet = require('../models/chefWallet');
const { getBlockedChefIds } = require('../utils/getBlockedChefIds');

require('dotenv').config();

const mongoURI = process.env.MONGO_URI_STAGING || process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    console.log('📡 Connected to MongoDB Staging...');
    
    // 1. Get blocked chef IDs from the actual function
    const blockedIds = await getBlockedChefIds();
    console.log('\n🚫 Blocked Chef IDs from getBlockedChefIds():', blockedIds);
    
    // 2. Get all chef wallets
    const wallets = await ChefWallet.find().populate('chef', 'fullName').lean();
    console.log(`\n💳 Chef Wallets found: ${wallets.length}`);
    wallets.forEach(w => {
      console.log(`   - Chef: "${w.chef?.fullName || 'Unknown'}" (${w.chef?._id}) | Balance: ${w.balance} | Grace Period Start: ${w.gracePeriodStartDate}`);
    });
    
    // 3. Check which chefs have wallets and which don't
    const chefs = await User.find({ type: 'chef' }).lean();
    console.log(`\n👥 All Chefs:`);
    for (const chef of chefs) {
      const wallet = await ChefWallet.findOne({ chef: chef._id }).lean();
      const isBlocked = blockedIds.some(id => id.toString() === chef._id.toString());
      console.log(`   - "${chef.fullName}" (${chef._id}) | Wallet Balance: ${wallet ? wallet.balance : 'No Wallet'} | Blocked: ${isBlocked}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

run();
