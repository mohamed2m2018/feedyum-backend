const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

// Load models
require('../models/loadModels');
const Notification = require('../models/notification');
const Message = require('../models/message');
const User = require('../models/user');
const Order = require('../models/order');
const Story = require('../models/story');

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected for Chef Mario fake data'))
.catch(err => console.log('Error connecting to database:', err));

const chefMarioNotifications = [
  // Order notifications for Chef Mario
  {
    type: 'order',
    title: 'New Order Received!',
    message: 'Sarah Johnson ordered 2x Margherita Pizza and 1x Caesar Salad',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    type: 'order',
    title: 'Order Update',
    message: 'Ahmed Hassan confirmed pickup for order #12347',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    type: 'order',
    title: 'Order Completed',
    message: 'Order #12346 has been delivered successfully',
    targetType: 'order',
    isRead: true,
    readAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },

  // Review notifications
  {
    type: 'review',
    title: 'New 5-Star Review!',
    message: 'Alex Thompson: "Best pizza in town! The dough is perfect 🍕"',
    targetType: 'dish',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    type: 'review',
    title: 'Customer Review',
    message: 'Maria Garcia rated your service 4 stars: "Great food, fast delivery!"',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },

  // Message notifications
  {
    type: 'message',
    title: 'Customer Message',
    message: 'David Lee: "Can you make the pasta extra spicy please?"',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
  },
  {
    type: 'message',
    title: 'Customer Message',
    message: 'Emma Wilson: "Thank you for the amazing dinner last night!"',
    isRead: true,
    readAt: new Date(Date.now() - 45 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },

  // Follow notifications
  {
    type: 'follow',
    title: 'New Follower',
    message: 'Food Critic James started following your restaurant',
    targetType: 'user',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },

  // Like notifications
  {
    type: 'like',
    title: 'Recipe Liked',
    message: 'Cooking Enthusiast Lisa liked your "Authentic Italian Carbonara" recipe',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    type: 'like',
    title: 'Dish Photo Liked',
    message: 'Food Blogger Mike liked your "Wood-fired Pizza" photo',
    targetType: 'story',
    isRead: true,
    readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },

  // Comment notifications
  {
    type: 'comment',
    title: 'New Comment',
    message: 'Tony Soprano: "This reminds me of my nonna\'s cooking! 👵🍝"',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
];

const chefMarioMessages = [
  "Chef Mario, when will my pizza be ready?",
  "Your lasagna was absolutely incredible! 🍝",
  "Can I get extra cheese on my order?",
  "Do you cater for events? I need food for 50 people",
  "The tiramisu was the best I've ever had!",
  "Is it possible to make it gluten-free?",
  "Your restaurant has the most authentic Italian food!",
  "Can you deliver to downtown area?",
  "I'd like to book a table for tonight",
  "The pasta was perfectly al dente! Compliments to the chef 👨‍🍳",
  "Do you have any vegan options?",
  "Your pizza reminds me of my trip to Naples!",
  "Can I order the same meal for tomorrow?",
  "The portion sizes are very generous, thank you!",
  "Is the kitchen still open for orders?",
];

const addFakeDataForChefMario = async () => {
  try {
    console.log('🍕 Starting to add fake data for Chef Mario...\n');

    // Find Chef Mario (try different variations)
    const chefMarioQueries = [
      { fullName: /mario/i, type: 'chef' },
      { username: /mario/i, type: 'chef' },
      { fullName: /mario/i },
      { username: /mario/i }
    ];

    let chefMario = null;
    for (const query of chefMarioQueries) {
      chefMario = await User.findOne(query);
      if (chefMario) break;
    }

    if (!chefMario) {
      console.log('❌ Chef Mario not found in database. Available users:');
      const users = await User.find({}, 'fullName username type').limit(10);
      users.forEach(user => {
        console.log(`- ${user.fullName} (@${user.username}) - ${user.type}`);
      });
      return;
    }

    console.log(`✅ Found Chef Mario: ${chefMario.fullName} (@${chefMario.username})`);

    // Get other users to send messages from
    const otherUsers = await User.find({ 
      _id: { $ne: chefMario._id } 
    }).limit(10);

    if (otherUsers.length === 0) {
      console.log('❌ No other users found to send messages from');
      return;
    }

    console.log(`Found ${otherUsers.length} other users to interact with Chef Mario`);

    // Get orders and stories for Chef Mario
    const chefOrders = await Order.find({ chef: chefMario._id }).limit(5);
    const chefStories = await Story.find({ user: chefMario._id }).limit(5);

    console.log(`Found ${chefOrders.length} orders and ${chefStories.length} stories for Chef Mario`);

    // Create notifications for Chef Mario
    const notificationsToCreate = [];
    
    chefMarioNotifications.forEach(notif => {
      const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      
      const notification = {
        ...notif,
        recipient: chefMario._id,
        sender: randomUser._id,
      };

      // Assign target IDs
      if (notif.targetType === 'order' && chefOrders.length > 0) {
        notification.targetId = chefOrders[Math.floor(Math.random() * chefOrders.length)]._id;
      } else if (notif.targetType === 'story' && chefStories.length > 0) {
        notification.targetId = chefStories[Math.floor(Math.random() * chefStories.length)]._id;
      } else if (notif.targetType === 'user') {
        notification.targetId = randomUser._id;
      } else {
        delete notification.targetType;
      }

      // Add deep linking data
      notification.data = {
        deepLink: `foodtok://${notif.type}/${notification.targetId || 'general'}`,
        chefId: chefMario._id.toString(),
        timestamp: notification.createdAt.toISOString(),
      };

      notificationsToCreate.push(notification);
    });

    // Create messages for Chef Mario
    const messagesToCreate = [];
    
    otherUsers.slice(0, 8).forEach((user, index) => {
      // Create 2-4 messages from each user to Chef Mario
      const numMessages = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numMessages; i++) {
        const messageText = chefMarioMessages[Math.floor(Math.random() * chefMarioMessages.length)];
        const isOrderRelated = Math.random() < 0.4 && chefOrders.length > 0;
        const isRead = Math.random() < 0.3; // 70% unread for testing
        
        const hoursAgo = Math.floor(Math.random() * 12);
        const minutesAgo = Math.floor(Math.random() * 60);
        const timestamp = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
        
        const message = {
          sender: user._id,
          receiver: chefMario._id,
          content: messageText,
          messageType: 'text',
          isRead: isRead,
          readAt: isRead ? new Date(timestamp.getTime() + 5 * 60 * 1000) : null,
          timestamp: timestamp,
          order: isOrderRelated ? chefOrders[Math.floor(Math.random() * chefOrders.length)]._id : null,
          isDeleted: false,
        };

        messagesToCreate.push(message);
      }
    });

    // Clear existing notifications and messages for Chef Mario
    await Notification.deleteMany({ recipient: chefMario._id });
    await Message.deleteMany({ receiver: chefMario._id });
    
    console.log('🧹 Cleared existing notifications and messages for Chef Mario');

    // Insert notifications
    if (notificationsToCreate.length > 0) {
      const createdNotifications = await Notification.insertMany(notificationsToCreate);
      console.log(`✅ Created ${createdNotifications.length} notifications for Chef Mario`);
    }

    // Insert messages
    if (messagesToCreate.length > 0) {
      const createdMessages = await Message.insertMany(messagesToCreate);
      console.log(`✅ Created ${createdMessages.length} messages for Chef Mario`);
    }

    // Show summary for Chef Mario
    const unreadNotifications = await Notification.countDocuments({ 
      recipient: chefMario._id, 
      isRead: false 
    });
    
    const unreadMessages = await Message.countDocuments({ 
      receiver: chefMario._id, 
      isRead: false 
    });
    
    const orderMessages = await Message.countDocuments({ 
      receiver: chefMario._id, 
      order: { $ne: null } 
    });

    console.log('\n🍕 Chef Mario Summary:');
    console.log(`👨‍🍳 Chef: ${chefMario.fullName} (@${chefMario.username})`);
    console.log(`🔔 Unread notifications: ${unreadNotifications}`);
    console.log(`💬 Unread messages: ${unreadMessages}`);
    console.log(`📦 Order-related messages: ${orderMessages}`);

    // Show notification breakdown
    const notificationTypes = await Notification.aggregate([
      { $match: { recipient: chefMario._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Notification types:');
    notificationTypes.forEach(type => {
      console.log(`- ${type._id}: ${type.count}`);
    });

    console.log('\n🎉 Fake data for Chef Mario added successfully!');
    console.log('📱 Chef Mario should now see notification badges in the app');

  } catch (error) {
    console.error('❌ Error adding fake data for Chef Mario:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the script
addFakeDataForChefMario(); 