const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

// Connect to MongoDB
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Load User model
require('../models/user');
const User = mongoose.model('user');

const checkUser = async () => {
  try {
    const email = 'testuser@foodtok.com';
    const password = 'TestPass123!';
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Full Name:', user.fullName);
    console.log('Type:', user.type);
    console.log('Profile Completed:', user.profileCompleted);
    console.log('');
    
    // Test password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password test result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');
    
    if (!isMatch) {
      console.log('');
      console.log('Let me try to update the password...');
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user password
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      
      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('=== UPDATED CREDENTIALS ===');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('===========================');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
checkUser();