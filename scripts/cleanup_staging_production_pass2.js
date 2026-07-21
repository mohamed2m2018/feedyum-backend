const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Models
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);
const dishSchema = new mongoose.Schema({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { strict: false, collection: 'dishes' });
const Dish = mongoose.model('Dish', dishSchema);
const menuSchema = new mongoose.Schema({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User'} }, { strict: false, collection: 'menus' });
const Menu = mongoose.model('Menu', menuSchema);
const sectionSchema = new mongoose.Schema({ owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { strict: false, collection: 'sections' });
const Section = mongoose.model('Section', sectionSchema);
const branchSchema = new mongoose.Schema({ chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { strict: false, collection: 'chefbranches' });
const ChefBranch = mongoose.model('ChefBranch', branchSchema);
const reelSchema = new mongoose.Schema({ chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { strict: false, collection: 'reels' });
const Reel = mongoose.model('Reel', reelSchema);

const explicitEmails = [
  '54@c.com',
  'testchef@feedyum.com',
  'testuser@feedyum.com',
  'reviewer@feedyum.com',
  'Mohamed.Shoman@eng.asu.edu.eg',
  't2@t.com'
];

async function cleanupMore() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Find these specific additional users
    const users = await User.find({ email: { $in: explicitEmails } });

    if (users.length > 0) {
      const userIds = users.map(u => u._id);
      console.log(`🧹 Found ${users.length} additional test users/kitchens.`);
      users.forEach(u => console.log(` - Deleting: ${u.fullName} (${u.email})`));

      await Dish.deleteMany({ owner: { $in: userIds } });
      await Menu.deleteMany({ $or: [{ owner: { $in: userIds } }, { chef: { $in: userIds } }] });
      await Section.deleteMany({ owner: { $in: userIds } });
      await ChefBranch.deleteMany({ chef: { $in: userIds } });
      await Reel.deleteMany({ chef: { $in: userIds } });
      
      await User.deleteMany({ _id: { $in: userIds } });
      console.log('✅ Cleaned up additional test entities.');
    } else {
        console.log('No additional test users found.');
    }

    console.log('\nFinal list of users:');
    const remainingUsers = await User.find({}, 'email type fullName').lean();
    remainingUsers.forEach(u => console.log(` • [${u.type || 'unknown'}] ${u.fullName} (${u.email})`));

  } catch(e) { console.error(e); } 
  finally { await mongoose.disconnect(); process.exit(); }
}

cleanupMore();
