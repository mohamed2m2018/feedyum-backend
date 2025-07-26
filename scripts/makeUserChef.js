const mongoose = require('mongoose');
const User = require('../models/user');
const mongoURI = require('../config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to database', err));

const makeUserChef = async () => {
  try {
    // Get the user ID from command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('Usage: node makeUserChef.js <userId>');
      console.log('Example: node makeUserChef.js 60f7b3b3b3b3b3b3b3b3b3b3');
      process.exit(1);
    }

    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`❌ User with ID ${userId} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.fullName || user.username} (${user.email})`);
    console.log(`Current type: ${user.type || 'not set'}`);

    // Update user to be a chef
    user.type = 'chef';
    user.hasMenu = true; // Set hasMenu to true
    user.bio = user.bio || 'Authentic Italian cuisine chef with 15 years of experience. Specializing in traditional pasta, pizza, and Mediterranean dishes.';
    
    await user.save();

    console.log('✅ User successfully updated to chef!');
    console.log(`New type: ${user.type}`);
    console.log(`Has menu: ${user.hasMenu}`);
    console.log(`Bio: ${user.bio}`);

  } catch (error) {
    console.error('❌ Error updating user:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Alternative: Find user by email
const makeUserChefByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`Found user: ${user.fullName || user.username} (${user.email})`);
    console.log(`Current type: ${user.type || 'not set'}`);

    // Update user to be a chef
    user.type = 'chef';
    user.hasMenu = true;
    user.bio = user.bio || 'Authentic Italian cuisine chef with 15 years of experience. Specializing in traditional pasta, pizza, and Mediterranean dishes.';
    
    await user.save();

    console.log('✅ User successfully updated to chef!');
    console.log(`User ID: ${user._id}`);
    console.log(`New type: ${user.type}`);
    console.log(`Has menu: ${user.hasMenu}`);

  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
};

// Check if email is provided instead of ID
const input = process.argv[2];
if (input && input.includes('@')) {
  makeUserChefByEmail(input).then(() => mongoose.connection.close());
} else {
  makeUserChef();
}