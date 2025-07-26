const mongoose = require('mongoose');
const Order = require('../models/order');
const User = require('../models/user');
const Dish = require('../models/dish');
const Menu = require('../models/menu');
const Message = require('../models/message');
const Address = require('../models/address');

// Sample delivery addresses
const sampleAddresses = [
  {
    nameLine: "123 Main Street, Downtown",
    location: { lat: "40.7128", long: "-74.0060" },
    isPrimary: true,
  },
  {
    nameLine: "456 Oak Avenue, Uptown",
    location: { lat: "40.7589", long: "-73.9851" },
    isPrimary: false,
  },
  {
    nameLine: "789 Pine Road, Suburbs",
    location: { lat: "40.6892", long: "-74.0445" },
    isPrimary: false,
  },
  {
    nameLine: "321 Elm Drive, City Center",
    location: { lat: "40.7505", long: "-73.9934" },
    isPrimary: false,
  },
  {
    nameLine: "654 Maple Lane, Riverside",
    location: { lat: "40.7282", long: "-73.7949" },
    isPrimary: false,
  }
];

// Sample special instructions
const specialInstructions = [
  "Please ring the doorbell twice",
  "Leave at the front desk",
  "Call when you arrive",
  "Allergic to nuts - please ensure no cross contamination",
  "Extra spicy please!",
  "No onions",
  "Please include extra sauce",
  "Delivery to apartment 4B",
  "Leave with the concierge",
  "Contactless delivery preferred",
  "Ring doorbell, don't knock",
  "Please use the side entrance",
  "Add extra cheese if possible",
  "Mild spice level only",
  "Please double-check the order"
];

// Status-specific messages for orders
const statusMessages = {
  pending: [
    "🍽️ New Order Received! We'll review your order and get back to you shortly.",
    "Thank you for your order! We're checking ingredient availability.",
    "Order received! Estimated preparation time: 45-60 minutes.",
    "Got your order! We'll confirm once we start cooking.",
  ],
  accepted: [
    "✅ Order Accepted! We're starting to prepare your delicious meal.",
    "Great news! Your order is confirmed and we're cooking now.",
    "Order accepted! Your food will be ready in about 45 minutes.",
    "We're on it! Cooking your order with love and care.",
    "Accepted! Fresh ingredients being prepared just for you.",
  ],
  completed: [
    "🎉 Order Complete! Your food is ready for pickup/delivery.",
    "All done! Your delicious meal is prepared and ready.",
    "Order completed! Hope you enjoy every bite!",
    "Ready to serve! Your order has been completed with care.",
    "Finished! Can't wait for you to taste what we've prepared.",
  ],
  cancelled: [
    "❌ Sorry, we had to cancel your order due to ingredient unavailability.",
    "Order cancelled. We're very sorry for the inconvenience.",
    "Unfortunately, we can't fulfill this order today. Full refund processed.",
    "Cancelled due to high demand. We apologize for the disappointment.",
  ]
};

// Function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Function to get random number between min and max
const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

// Function to get random date within last 30 days
const getRandomRecentDate = () => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
};

// Generate realistic order data
const generateOrderTestData = async () => {
  try {
    console.log('🚀 Starting order test data generation...');

    // Get existing users (customers and chefs)
    const customers = await User.find({ type: { $ne: 'chef' } }).limit(10);
    const chefs = await User.find({ type: 'chef' }).limit(5);
    
    if (customers.length === 0 || chefs.length === 0) {
      console.log('❌ Need existing customers and chefs in database first');
      return;
    }

    // Get existing dishes for each chef
    const dishesData = {};
    for (const chef of chefs) {
      const menu = await Menu.findOne({ chef: chef._id });
      if (menu) {
        const dishes = await Dish.find({ menu: menu._id }).limit(8);
        dishesData[chef._id] = dishes;
        console.log(`🍽️ Chef ${chef.fullName || chef.username}: ${dishes.length} dishes`);
      } else {
        console.log(`⚠️  Chef ${chef.fullName || chef.username}: No menu found`);
      }
    }

    // If no dishes found, try alternative approach - get dishes by user_id
    const totalChefDishes = Object.values(dishesData).reduce((sum, dishes) => sum + dishes.length, 0);
    if (totalChefDishes === 0) {
      console.log('🔍 No dishes found via menu. Trying alternative approach...');
      for (const chef of chefs) {
        const dishes = await Dish.find({ user_id: chef._id.toString() }).limit(8);
        if (dishes.length > 0) {
          dishesData[chef._id] = dishes;
          console.log(`✅ Chef ${chef.fullName || chef.username}: ${dishes.length} dishes (via user_id)`);
        }
      }
    }

    // Check if we have enough data to generate orders
    const chefsWithDishes = Object.entries(dishesData).filter(([chefId, dishes]) => dishes.length > 0);
    
    if (chefsWithDishes.length === 0) {
      console.log('❌ No chefs with dishes found. Cannot generate orders.');
      console.log('💡 Make sure chefs have dishes in their menus or linked via user_id.');
      return;
    }

    console.log(`✅ Found ${chefsWithDishes.length} chefs with dishes. Proceeding with order generation.`);

    // Clear existing test orders (optional)
    await Order.deleteMany({ specialInstructions: { $regex: /Test Order|Sample Order/ } });

    const orders = [];
    const messages = [];

    // Generate 50 orders with different statuses
    for (let i = 0; i < 50; i++) {
      const customer = getRandomElement(customers);
      // Only select chefs that have dishes
      const availableChefs = chefsWithDishes.map(([chefId]) => 
        chefs.find(chef => chef._id.toString() === chefId)
      );
      const chef = getRandomElement(availableChefs);
      const chefDishes = dishesData[chef._id] || [];
      
      if (chefDishes.length === 0) continue;

      // Randomly select 1-4 dishes for the order
      const numItems = Math.floor(Math.random() * 4) + 1;
      const orderItems = [];
      const selectedDishes = [];

      for (let j = 0; j < numItems; j++) {
        const dish = getRandomElement(chefDishes);
        if (!selectedDishes.includes(dish._id.toString())) {
          selectedDishes.push(dish._id.toString());
          orderItems.push({
            dish: dish._id,
            quantity: Math.floor(Math.random() * 3) + 1
          });
        }
      }

      // Calculate pricing
      let subtotal = 0;
      for (const item of orderItems) {
        const dish = chefDishes.find(d => d._id.toString() === item.dish.toString());
        if (dish) {
          subtotal += dish.price * item.quantity;
        }
      }

      const deliveryFee = getRandomNumber(3, 8);
      const tax = subtotal * 0.1;
      const totalPrice = subtotal + deliveryFee + tax;

      // Assign status with realistic distribution
      let status;
      const statusRandom = Math.random();
      if (statusRandom < 0.3) status = 'pending';
      else if (statusRandom < 0.6) status = 'accepted';
      else if (statusRandom < 0.85) status = 'completed';
      else status = 'cancelled';

      // Create order
      const orderDate = getRandomRecentDate();
      const order = new Order({
        user: customer._id,
        chef: chef._id,
        items: orderItems,
        totalPrice: Math.round(totalPrice * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        deliveryAddress: getRandomElement(sampleAddresses),
        specialInstructions: `Test Order - ${getRandomElement(specialInstructions)}`,
        created_at: orderDate,
        status: status
      });

      orders.push(order);

      // Create initial message from chef to customer
      const orderMessage = `🍽️ Order #${i.toString().padStart(3, '0')} - ${getRandomElement(statusMessages[status])}

📋 Order Details:
${orderItems.map((item, idx) => {
        const dish = chefDishes.find(d => d._id.toString() === item.dish.toString());
        return `• ${dish ? dish.name : 'Unknown Dish'} x${item.quantity} - $${dish ? (dish.price * item.quantity).toFixed(2) : '0.00'}`;
      }).join('\n')}

💰 Total: $${totalPrice.toFixed(2)}
📍 Delivery: ${order.deliveryAddress.nameLine}
${order.specialInstructions ? `📝 Notes: ${order.specialInstructions}` : ''}`;

      const initialMessage = new Message({
        sender: chef._id,
        receiver: customer._id,
        content: orderMessage,
        timestamp: new Date(orderDate.getTime() + (5 * 60 * 1000)) // 5 minutes after order
      });

      messages.push(initialMessage);

      // Add follow-up messages based on status
      if (status === 'accepted') {
        const followUpMessage = new Message({
          sender: chef._id,
          receiver: customer._id,
          content: "🔥 Your order is now being prepared! Estimated completion time: 45 minutes.",
          timestamp: new Date(orderDate.getTime() + (10 * 60 * 1000))
        });
        messages.push(followUpMessage);
      } else if (status === 'completed') {
        const followUpMessage1 = new Message({
          sender: chef._id,
          receiver: customer._id,
          content: "🔥 Your order is now being prepared! Should be ready soon.",
          timestamp: new Date(orderDate.getTime() + (10 * 60 * 1000))
        });
        const completionMessage = new Message({
          sender: chef._id,
          receiver: customer._id,
          content: "🎉 Your order is ready! Thanks for choosing us. Hope you enjoy your meal!",
          timestamp: new Date(orderDate.getTime() + (45 * 60 * 1000))
        });
        messages.push(followUpMessage1, completionMessage);
      } else if (status === 'cancelled') {
        const cancellationMessage = new Message({
          sender: chef._id,
          receiver: customer._id,
          content: "😔 Sorry, we had to cancel your order. You'll receive a full refund within 2-3 business days.",
          timestamp: new Date(orderDate.getTime() + (15 * 60 * 1000))
        });
        messages.push(cancellationMessage);
      }

      // Add some customer responses (30% chance)
      if (Math.random() < 0.3) {
        const customerResponses = [
          "Thank you! Looking forward to it 😊",
          "Sounds great! Thanks for the update",
          "Perfect timing, thanks!",
          "Can't wait to try it!",
          "Thanks for keeping me updated",
          "Excellent service as always!",
          "You guys are the best!",
          "Much appreciated!"
        ];

        const customerMessage = new Message({
          sender: customer._id,
          receiver: chef._id,
          content: getRandomElement(customerResponses),
          timestamp: new Date(orderDate.getTime() + (20 * 60 * 1000))
        });
        messages.push(customerMessage);
      }
    }

    // Save all orders and messages
    console.log(`💾 Saving ${orders.length} orders and ${messages.length} messages...`);
    
    await Order.insertMany(orders);
    await Message.insertMany(messages);

    console.log('✅ Test data generation completed successfully!');
    console.log(`📊 Generated:
    - ${orders.length} orders
    - ${messages.length} messages
    - Status distribution:
      • Pending: ${orders.filter(o => o.status === 'pending').length}
      • Accepted: ${orders.filter(o => o.status === 'accepted').length}
      • Completed: ${orders.filter(o => o.status === 'completed').length}
      • Cancelled: ${orders.filter(o => o.status === 'cancelled').length}`);

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
};

// Function to clean test data
const cleanOrderTestData = async () => {
  try {
    console.log('🧹 Cleaning test order data...');
    
    const deleteResult = await Order.deleteMany({ 
      specialInstructions: { $regex: /Test Order/ }
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} test orders`);
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  }
};

module.exports = {
  generateOrderTestData,
  cleanOrderTestData
};

// If running directly
if (require.main === module) {
  const mongoURI = require('../config/keys').mongoURI;
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('📱 Connected to MongoDB');
    generateOrderTestData().then(() => {
      mongoose.disconnect();
    });
  }).catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
} 