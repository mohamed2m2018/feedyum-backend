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

const createFreshUser = async () => {
  try {
    // Fresh user credentials with proper password format
    const userData = {
      email: 'demo@foodtok.com',
      password: 'Demo123!',
      fullName: 'Demo User',
      username: 'demouser',
      type: 'user',
      gender: 'male',
      phone: '+201234567890',
      profileCompleted: true,
      postsNo: 0,
      likesNo: 0,
      wallet: 0,
      isGoogleUser: false,
      bio: 'Demo user account for testing',
      hasMenu: false,
      locations: [{
        description: 'Cairo, Egypt',
        lat: 30.0444,
        long: 31.2357
      }]
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('✅ User already exists!');
      console.log('Email:', userData.email);
      console.log('Password: Demo123!');
      process.exit(0);
    }

    // Hash password properly
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create new user
    const newUser = new User({
      ...userData,
      password: hashedPassword
    });

    // Save user
    const savedUser = await newUser.save();
    
    console.log('✅ Fresh demo user created successfully!');
    console.log('');
    console.log('=== DEMO USER CREDENTIALS ===');
    console.log('Email: demo@foodtok.com');
    console.log('Password: Demo123!');
    console.log('Full Name:', userData.fullName);
    console.log('Username:', userData.username);
    console.log('User ID:', savedUser._id);
    console.log('=============================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
};

// Run the script
createFreshUser();