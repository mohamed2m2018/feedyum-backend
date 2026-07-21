require('dotenv').config();
const mongoose = require('mongoose');
const { getBlockedChefIds } = require('./utils/getBlockedChefIds');

async function testBlocked() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const blocked = await getBlockedChefIds();
    console.log("Blocked chef IDs:", blocked);
    
    // Check if FeedYum Kitchen is blocked
    const chefId = new mongoose.Types.ObjectId("69c663ebc70b40dbb291e509");
    const isBlocked = blocked.some(id => id.toString() === chefId.toString());
    console.log("Is FeedYum Kitchen blocked?", isBlocked);
    
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
testBlocked();
