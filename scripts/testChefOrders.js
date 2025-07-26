const mongoose = require('mongoose');
const User = require('../models/user');
const Menu = require('../models/menu');
const Dish = require('../models/dish');
const Order = require('../models/order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/foodtok', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testChefData() {
  try {
    console.log('🔍 Testing chef data...');
    
    // Check chefs
    const chefs = await User.find({ type: 'chef' }).select('_id fullName username');
    console.log(`👨‍🍳 Found ${chefs.length} chefs:`);
    chefs.forEach(chef => {
      console.log(`   - ${chef.fullName} (${chef._id})`);
    });
    
    // Check menus
    const menus = await Menu.find().populate('owner', 'fullName');
    console.log(`\n📋 Found ${menus.length} menus:`);
    menus.forEach(menu => {
      console.log(`   - ${menu.name} by ${menu.owner?.fullName}`);
    });
    
    // Check dishes
    const dishes = await Dish.find().populate('owner', 'fullName');
    console.log(`\n🍽️  Found ${dishes.length} dishes:`);
    dishes.slice(0, 10).forEach(dish => {
      console.log(`   - ${dish.name} by ${dish.owner?.fullName} ($${dish.price})`);
    });
    
    if (dishes.length > 10) {
      console.log(`   ... and ${dishes.length - 10} more dishes`);
    }
    
    // Check orders
    const orders = await Order.find().populate('user chef', 'fullName');
    console.log(`\n📦 Found ${orders.length} orders:`);
    orders.slice(0, 5).forEach(order => {
      console.log(`   - Order ${order._id.toString().slice(-6)} by ${order.user?.fullName} from ${order.chef?.fullName}`);
    });
    
    console.log('\n✅ Data check completed!');
    
  } catch (error) {
    console.error('❌ Error testing chef data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testChefData();