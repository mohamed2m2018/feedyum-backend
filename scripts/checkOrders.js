const mongoose = require('mongoose');
const keys = require('../config/keys');
const Order = require('../models/order');
const User = require('../models/user');

async function checkOrders() {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Count total orders
    const totalOrders = await Order.countDocuments();
    console.log(`📦 Total orders in database: ${totalOrders}`);

    if (totalOrders > 0) {
      // Get recent orders
      const recentOrders = await Order.find()
        .populate('user', 'fullName username')
        .populate('chef', 'fullName username')
        .sort({ created_at: -1 })
        .limit(5)
        .lean();

      console.log('\n🔍 Recent orders:');
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order #${order._id.toString().slice(-6)}`);
        console.log(`   Customer: ${order.user?.fullName || 'Unknown'}`);
        console.log(`   Chef: ${order.chef?.fullName || 'Unknown'}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: $${order.totalPrice}`);
        console.log(`   Created: ${order.created_at}`);
        console.log('');
      });
    }

    // Check users count
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ type: 'customer' });
    const chefs = await User.countDocuments({ type: 'chef' });
    
    console.log(`👥 Total users: ${totalUsers}`);
    console.log(`👤 Customers: ${customers}`);
    console.log(`👨‍🍳 Chefs: ${chefs}`);

  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkOrders();