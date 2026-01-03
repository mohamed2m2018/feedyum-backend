const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const keys = require('../config/keys');

// Connect to MongoDB
mongoose
  .connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const createUsers = async () => {
  try {
    const commonPassword = 'TestUser123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(commonPassword, salt);

    const users = [
      {
        email: 'testuser@foodtok.com',
        username: 'testuser',
        fullName: 'Test User',
        password: hashedPassword,
        type: 'user',
        profileCompleted: true,
        isGoogleUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Test+User&background=random',
      },
      {
        email: 'testchef@foodtok.com',
        username: 'testchef',
        fullName: 'Test Chef',
        password: hashedPassword,
        type: 'chef',
        profileCompleted: true,
        isGoogleUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Test+Chef&background=random',
        chefSettings: {
            country: 'United States',
            currency: 'USD',
            currencySymbol: '$',
            isCountryLocked: true,
            totalBranches: 0,
            hasBranches: false
        }
      },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists.`);
        
        // Update password just in case
        existingUser.password = hashedPassword;
        await existingUser.save();
        console.log(`Updated password for ${userData.email}`);
      } else {
        const newUser = new User(userData);
        await newUser.save();
        console.log(`Created user ${userData.email}`);
      }
    }

    console.log('\n--- Credentials ---');
    console.log('User Account:');
    console.log('Email: testuser@foodtok.com');
    console.log('Password: TestUser123!');
    console.log('\nChef Account:');
    console.log('Email: testchef@foodtok.com');
    console.log('Password: TestUser123!');
    console.log('-------------------\n');

  } catch (err) {
    console.error('Error creating users:', err);
  } finally {
    mongoose.connection.close();
  }
};

createUsers();
