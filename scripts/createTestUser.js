const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const mongoURI = require('../config/keys').mongoURI;

async function createTestUser() {
  try {
    console.log('🔌 Connecting to remote MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to remote MongoDB successfully!');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testorder@foodtok.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   Email: testorder@foodtok.com`);
      console.log(`   Password: password123`);
      console.log(`   Name: ${existingUser.fullName}`);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test user
    const testUser = new User({
      fullName: 'Test Order User',
      username: 'testorderuser',
      email: 'testorder@foodtok.com',
      password: hashedPassword,
      type: 'user', // Regular user, not chef
      profileCompleted: true,
      phone: '1234567890',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      bio: 'Test user for placing orders',
      created_at: new Date(),
    });
    
    await testUser.save();
    
    console.log('✅ Created test user successfully!');
    console.log('📧 Login credentials:');
    console.log('   Email: testorder@foodtok.com');
    console.log('   Password: password123');
    console.log('   Type: Regular user (can place orders)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

createTestUser();