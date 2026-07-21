require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const keys = require('../config/keys');

const User = require('../models/user');
const ChefBranch = require('../models/chefBranch');
const Menu = require('../models/menu');
const Section = require('../models/section');
const Dish = require('../models/dish');

mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAccounts = async () => {
  try {
    const password = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('--- Cleaning up old experimental accounts ---');
    await User.deleteMany({ email: { $in: ['experimental_chef@feedyum.com', 'experimental_user@feedyum.com'] } });
    
    // We clean up related entities conceptually, but matching by owner is best.
    const obsoleteChefs = await User.find({ email: 'experimental_chef@feedyum.com' });
    for (const c of obsoleteChefs) {
      await ChefBranch.deleteMany({ chef: c._id });
      await Menu.deleteMany({ chef: c._id });
      await Section.deleteMany({ owner: c._id });
      await Dish.deleteMany({ user_id: c._id });
    }

    console.log('--- Creating Kitchen Account ---');
    const chef = new User({
      email: 'experimental_chef@feedyum.com',
      username: 'experimental_chef',
      fullName: 'Feedyum Experimental Kitchen',
      password: hashedPassword,
      type: 'chef',
      profileCompleted: true,
      isGoogleUser: false,
      hasMenu: true,
      bio: 'Experimental Feedyum account for testing purposes.',
      phone: '+201111111111',
      avatar: 'https://feedyum.com/images/logo.png',
      chefSettings: {
        country: 'Egypt',
        currency: 'EGP',
        currencySymbol: '£E',
        isCountryLocked: true,
        totalBranches: 1,
        hasBranches: true,
        requireCustomerConfirmation: true,
        allowScheduledOrders: false,
        requireDeposit: false,
      }
    });
    await chef.save();

    const branch = new ChefBranch({
      chef: chef._id,
      addressDetails: {
        streetName: 'Test St',
        buildingNumber: '1',
        area: 'Downtown',
        city: 'Cairo',
        country: 'Egypt',
        formattedAddress: '1 Test St, Downtown, Cairo, Egypt'
      },
      location: { lat: 30.0444, long: 31.2357 },
      branchName: 'Main Branch',
      contactInfo: { phoneNumber: '1111111111', countryCode: '+20' },
      isActive: true,
      isPrimary: true,
      deliveryRadius: 10,
      deliveryFee: 20,
      operatingHours: [
        { day: 'monday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'tuesday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'wednesday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'thursday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'friday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'saturday', isOpen: true, openTime: '00:00', closeTime: '23:59' },
        { day: 'sunday', isOpen: true, openTime: '00:00', closeTime: '23:59' }
      ]
    });
    await branch.save();

    const section = new Section({
      name: 'Main Dishes',
      nameEnglish: 'Main Dishes',
      nameArabic: 'الأطباق الرئيسية',
      owner: chef._id
    });
    await section.save();

    const menu = new Menu({
      name: 'Experimental Kitchen Menu',
      chef: chef._id,
      sections: [section._id]
    });
    await menu.save();

    const dish = new Dish({
      id: Math.floor(Math.random() * 100000),
      name: 'Signature Test Dish',
      nameEnglish: 'Signature Test Dish',
      nameArabic: 'طبق تجريبي مميز',
      description: 'A delicious experimental dish ready for testing orders.',
      descriptionEnglish: 'A delicious experimental dish ready for testing orders.',
      descriptionArabic: 'طبق تجريبي لذيذ جاهز لاختبار الطلبات.',
      price: 150,
      category: 'Main Course',
      menu: menu._id,
      menu_id: 1,
      user_id: chef._id,
      section: section._id,
      visible: true,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    });
    await dish.save();
    menu.dishes = [dish._id];
    await menu.save();

    console.log('--- Creating Customer Account ---');
    const user = new User({
      email: 'experimental_user@feedyum.com',
      username: 'experimental_user',
      fullName: 'Experimental Customer',
      password: hashedPassword,
      type: 'user',
      profileCompleted: true,
      isGoogleUser: false,
      locations: [{ description: 'Cairo, Egypt', lat: 30.0444, long: 31.2357 }],
      phone: '+201222222222',
      avatar: 'https://feedyum.com/images/logo.png',
    });
    await user.save();

    console.log('\n✅ Accounts created successfully!');
    console.log('\n================================');
    console.log('👨‍🍳 KITCHEN CREDENTIALS');
    console.log('================================');
    console.log('Email:      experimental_chef@feedyum.com');
    console.log('Password:   Password123!');
    console.log('Status:     Configured with 1 active branch, menu, and a dish.');
    
    console.log('\n================================');
    console.log('👤 CUSTOMER CREDENTIALS');
    console.log('================================');
    console.log('Email:      experimental_user@feedyum.com');
    console.log('Password:   Password123!');
    console.log('\nAll set for testing interactions between the customer and the kitchen.');

  } catch (err) {
    console.error('Error creating accounts:', err);
  } finally {
    process.exit(0);
  }
};

createAccounts();
