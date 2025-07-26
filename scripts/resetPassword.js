#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Load all models
require('../models/loadModels');

const mongoURI = require('../config/keys').mongoURI;

async function resetChefMarioPassword() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📱 Connected to MongoDB');

    // Find Chef Mario
    const marioChef = await User.findOne({ 
      email: 'chef_mario@example.com',
      type: 'chef'
    });

    if (!marioChef) {
      console.log('❌ Chef Mario not found');
      return;
    }

    console.log(`\n👨‍🍳 Found Chef: ${marioChef.fullName || marioChef.username}`);
    console.log(`   Email: ${marioChef.email}`);
    console.log(`   ID: ${marioChef._id}`);

    // Set a simple password for testing
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await User.findByIdAndUpdate(marioChef._id, { password: hashedPassword });

    console.log('\n✅ Password updated successfully!');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log(`   Email: chef_mario@example.com`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n📱 Now you can login to your mobile app with these credentials');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

resetChefMarioPassword(); 