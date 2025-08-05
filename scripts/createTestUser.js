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

const createTestUser = async () => {
  try {
    // Test user credentials
    const testUserData = {
      email: 'testuser2@foodtok.com',
      password: 'TestPass123!',
      fullName: 'Test User 2',
      username: 'testuser456',
      type: 'user', // normal user type
      gender: 'male',
      phone: '+201234567890',
      profileCompleted: true,
      postsNo: 0,
      likesNo: 0,
      wallet: 0,
      isGoogleUser: false,
      bio: 'Test user account for development',
      hasMenu: false,
      locations: [{
        description: 'Cairo, Egypt',
        lat: 30.0444,
        long: 31.2357
      }]
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUserData.email });
    if (existingUser) {
      console.log('User already exists with email:', testUserData.email);
      console.log('Credentials:');
      console.log('Email:', testUserData.email);
      console.log('Password: TestPass123!');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUserData.password, salt);

    // Create new user
    const newUser = new User({
      ...testUserData,
      password: hashedPassword
    });

    // Save user to database
    const savedUser = await newUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('=== USER CREDENTIALS ===');
    console.log('Email:', testUserData.email);
    console.log('Password:', 'TestPass123!');
    console.log('Full Name:', testUserData.fullName);
    console.log('Username:', testUserData.username);
    console.log('Type:', testUserData.type);
    console.log('User ID:', savedUser._id);
    console.log('========================');
    console.log('');
    console.log('You can now use these credentials to login to the app.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

// Run the script
createTestUser();