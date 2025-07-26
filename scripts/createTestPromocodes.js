const mongoose = require('mongoose');
const PromoCode = require('../models/promocode');
const User = require('../models/user');
const mongoURI = require('../config/keys').mongoURI;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Error connecting to database', err));

const createTestPromocodes = async () => {
  try {
    // Find an admin user to set as creator (or create a dummy one)
    let adminUser = await User.findOne({ type: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        type: 'admin',
        fullName: 'Admin User'
      });
      await adminUser.save();
    }

    // Create test promocodes
    const testPromocodes = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        maxDiscount: 5,
        minOrderAmount: 15,
        usageLimit: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'SAVE5',
        discountType: 'fixed',
        discountValue: 5,
        minOrderAmount: 20,
        usageLimit: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'FIRSTORDER',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 10,
        minOrderAmount: 10,
        usageLimit: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'BIGORDER',
        discountType: 'fixed',
        discountValue: 15,
        minOrderAmount: 50,
        usageLimit: 20,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'EXPIRED',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 0,
        validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
        createdBy: adminUser._id,
        isActive: true
      }
    ];

    // Clear existing test promocodes
    await PromoCode.deleteMany({ code: { $in: testPromocodes.map(p => p.code) } });

    // Create new promocodes
    for (const promocodeData of testPromocodes) {
      const promocode = new PromoCode(promocodeData);
      await promocode.save();
      console.log(`Created promocode: ${promocode.code}`);
    }

    console.log('\n✅ Test promocodes created successfully!');
    console.log('\nAvailable promocodes:');
    console.log('- WELCOME10: 10% off (max £5) on orders over £15');
    console.log('- SAVE5: £5 off on orders over £20');
    console.log('- FIRSTORDER: 20% off (max £10) on orders over £10');
    console.log('- BIGORDER: £15 off on orders over £50');
    console.log('- EXPIRED: Expired promocode for testing');

  } catch (error) {
    console.error('Error creating test promocodes:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createTestPromocodes();