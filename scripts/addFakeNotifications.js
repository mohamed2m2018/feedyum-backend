const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

// Load models
require('../models/loadModels');
const Notification = require('../models/notification');
const User = require('../models/user');
const Order = require('../models/order');
const Story = require('../models/story');

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected for fake notifications'))
.catch(err => console.log('Error connecting to database:', err));

const fakeNotifications = [
  // Message notifications
  {
    type: 'message',
    title: 'New Message',
    message: 'Ahmed sent you a message about your order',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    type: 'message',
    title: 'New Message',
    message: 'Sarah replied to your message',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    type: 'message',
    title: 'New Message',
    message: 'Chef Mohammed confirmed your order details',
    isRead: true,
    readAt: new Date(Date.now() - 10 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },

  // Order notifications
  {
    type: 'order',
    title: 'Order Update',
    message: 'Your order #12345 is being prepared',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order #12344 has been delivered. Enjoy your meal!',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    type: 'order',
    title: 'New Order Received',
    message: 'You have a new order from Fatima Al-Zahra',
    targetType: 'order',
    isRead: true,
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },

  // Like notifications
  {
    type: 'like',
    title: 'New Like',
    message: 'Omar liked your cooking video',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
  },
  {
    type: 'like',
    title: 'New Like',
    message: 'Layla liked your Mansaf recipe',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    type: 'like',
    title: 'New Like',
    message: 'Khalid liked your Kabsa dish',
    targetType: 'dish',
    isRead: true,
    readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },

  // Comment notifications
  {
    type: 'comment',
    title: 'New Comment',
    message: 'Nour commented: "This looks delicious! Can you share the recipe?"',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    type: 'comment',
    title: 'New Comment',
    message: 'Youssef commented: "Amazing presentation! 👨‍🍳"',
    targetType: 'story',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },

  // Follow notifications
  {
    type: 'follow',
    title: 'New Follower',
    message: 'Mariam started following you',
    targetType: 'user',
    isRead: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    type: 'follow',
    title: 'New Follower',
    message: 'Chef Hassan started following you',
    targetType: 'user',
    isRead: true,
    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
  },

  // Review notifications
  {
    type: 'review',
    title: 'New Review',
    message: 'Amira gave you 5 stars: "Best Shawarma in town!"',
    targetType: 'dish',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
  },
  {
    type: 'review',
    title: 'New Review',
    message: 'Abdullah rated your service 4 stars',
    targetType: 'order',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },

  // Promotion notifications
  {
    type: 'promotion',
    title: 'Special Offer!',
    message: '20% off on all orders today! Use code SAVE20',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // Expires in 20 hours
  },
  {
    type: 'promotion',
    title: 'Weekend Special',
    message: 'Free delivery on orders above $25 this weekend',
    isRead: true,
    readAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
];

const addFakeNotifications = async () => {
  try {
    console.log('Starting to add fake notifications...');

    // Get some users from the database
    const users = await User.find().limit(10);
    if (users.length === 0) {
      console.log('No users found in database. Please add some users first.');
      return;
    }

    console.log(`Found ${users.length} users in database`);

    // Get some orders and stories for target IDs
    const orders = await Order.find().limit(5);
    const stories = await Story.find().limit(5);

    console.log(`Found ${orders.length} orders and ${stories.length} stories`);

    // Create notifications for each user
    const notificationsToCreate = [];

    users.forEach((user, userIndex) => {
      // Add 3-5 notifications per user
      const numNotifications = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numNotifications; i++) {
        const fakeNotif = fakeNotifications[Math.floor(Math.random() * fakeNotifications.length)];
        const otherUser = users[Math.floor(Math.random() * users.length)];
        
        const notification = {
          ...fakeNotif,
          recipient: user._id,
          sender: otherUser._id !== user._id ? otherUser._id : null,
        };

        // Assign target IDs based on type
        if (fakeNotif.targetType === 'order' && orders.length > 0) {
          notification.targetId = orders[Math.floor(Math.random() * orders.length)]._id;
        } else if (fakeNotif.targetType === 'story' && stories.length > 0) {
          notification.targetId = stories[Math.floor(Math.random() * stories.length)]._id;
        } else if (fakeNotif.targetType === 'user') {
          notification.targetId = otherUser._id;
        } else {
          // Remove targetType if it's not set to avoid validation errors
          delete notification.targetType;
        }

        // Add some randomness to timing
        const randomMinutes = Math.floor(Math.random() * 60);
        notification.createdAt = new Date(notification.createdAt.getTime() + randomMinutes * 60 * 1000);

        // Add some additional data for deep linking
        notification.data = {
          deepLink: `foodtok://${fakeNotif.type}/${notification.targetId || 'general'}`,
          metadata: {
            notificationType: fakeNotif.type,
            timestamp: notification.createdAt.toISOString(),
          }
        };

        notificationsToCreate.push(notification);
      }
    });

    console.log(`Preparing to create ${notificationsToCreate.length} notifications...`);

    // Clear existing notifications first (optional)
    const existingCount = await Notification.countDocuments();
    console.log(`Found ${existingCount} existing notifications`);
    
    if (existingCount > 0) {
      console.log('Clearing existing notifications...');
      await Notification.deleteMany({});
      console.log('Existing notifications cleared');
    }

    // Insert all notifications
    const createdNotifications = await Notification.insertMany(notificationsToCreate);
    
    console.log(`✅ Successfully created ${createdNotifications.length} fake notifications!`);

    // Show summary
    const unreadCount = await Notification.countDocuments({ isRead: false });
    const readCount = await Notification.countDocuments({ isRead: true });
    
    console.log('\n📊 Summary:');
    console.log(`- Total notifications: ${createdNotifications.length}`);
    console.log(`- Unread: ${unreadCount}`);
    console.log(`- Read: ${readCount}`);
    
    // Show notifications by type
    const notificationTypes = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📋 By type:');
    notificationTypes.forEach(type => {
      console.log(`- ${type._id}: ${type.count}`);
    });

    console.log('\n🎉 Fake notifications added successfully!');
    console.log('You can now test the notification system in the app.');

  } catch (error) {
    console.error('❌ Error adding fake notifications:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the script
addFakeNotifications(); 