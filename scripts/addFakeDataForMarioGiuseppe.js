const mongoose = require('mongoose');
require('../models/loadModels');

const Message = require('../models/message');
const Notification = require('../models/notification');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect(require('../config/keys').mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const MARIO_GIUSEPPE_ID = '6870a1033a695f44a26f1f07';

async function clearExistingData() {
  console.log('🧹 Clearing existing data for Mario Giuseppe...');
  
  // Clear existing messages and notifications for Mario Giuseppe
  await Message.deleteMany({ receiver: MARIO_GIUSEPPE_ID });
  await Notification.deleteMany({ recipient: MARIO_GIUSEPPE_ID });
  
  console.log('✅ Cleared existing data');
}

async function addFakeMessages() {
  console.log('💬 Adding fake messages for Mario Giuseppe...');
  
  // Get some other users to send messages from
  const otherUsers = await User.find({ 
    _id: { $ne: MARIO_GIUSEPPE_ID },
    type: { $in: ['chef', 'customer'] }
  }).limit(5);
  
  if (otherUsers.length === 0) {
    console.log('⚠️  No other users found, creating basic messages');
    return;
  }
  
  const messages = [];
  
  // Create unread regular messages from different users
  for (let i = 0; i < otherUsers.length; i++) {
    const sender = otherUsers[i];
    
    // Add 2-3 unread messages from each sender
    for (let j = 0; j < 3; j++) {
      messages.push({
        sender: sender._id,
        receiver: MARIO_GIUSEPPE_ID,
        content: `Hey Mario! This is message ${j + 1} from ${sender.fullName}. How are you?`,
        messageType: 'text',
        isRead: false, // UNREAD
        isDeleted: false,
        createdAt: new Date(Date.now() - (Math.random() * 24 * 60 * 60 * 1000)) // Random time in last 24h
      });
    }
  }
  
  // Create some ORDER-RELATED unread messages
  for (let i = 0; i < 5; i++) {
    const sender = otherUsers[i % otherUsers.length];
    messages.push({
      sender: sender._id,
      receiver: MARIO_GIUSEPPE_ID,
      content: `Order update: Your order #${1000 + i} is ready for pickup!`,
      messageType: 'text',
      isRead: false, // UNREAD
      isDeleted: false,
      order: new mongoose.Types.ObjectId(), // This makes it count as order message
      createdAt: new Date(Date.now() - (Math.random() * 12 * 60 * 60 * 1000)) // Random time in last 12h
    });
  }
  
  await Message.insertMany(messages);
  console.log(`✅ Added ${messages.length} fake messages for Mario Giuseppe`);
}

async function addFakeNotifications() {
  console.log('🔔 Adding fake notifications for Mario Giuseppe...');
  
  const notifications = [];
  
  // Get some other users as senders
  const otherUsers = await User.find({ 
    _id: { $ne: MARIO_GIUSEPPE_ID },
    type: { $in: ['chef', 'customer'] }
  }).limit(3);
  
  const notificationTypes = [
    {
      type: 'like',
      title: 'New Like!',
      message: 'Someone liked your dish',
      targetType: 'dish'
    },
    {
      type: 'comment',
      title: 'New Comment',
      message: 'Someone commented on your post',
      targetType: 'dish'
    },
    {
      type: 'follow',
      title: 'New Follower',
      message: 'You have a new follower',
      targetType: 'user'
    },
    {
      type: 'order',
      title: 'New Order',
      message: 'You received a new order',
      targetType: 'order'
    },
    {
      type: 'review',
      title: 'New Review',
      message: 'Someone reviewed your dish',
      targetType: 'dish'
    }
  ];
  
  // Create unread notifications
  for (let i = 0; i < 8; i++) {
    const sender = otherUsers[i % otherUsers.length];
    const notifType = notificationTypes[i % notificationTypes.length];
    
    const notification = {
      recipient: MARIO_GIUSEPPE_ID,
      sender: sender?._id,
      type: notifType.type,
      title: notifType.title,
      message: `${sender?.fullName || 'Someone'} ${notifType.message.toLowerCase()}`,
      targetId: new mongoose.Types.ObjectId(),
      targetType: notifType.targetType,
      isRead: false, // UNREAD
      createdAt: new Date(Date.now() - (Math.random() * 48 * 60 * 60 * 1000)), // Random time in last 48h
      data: {
        senderName: sender?.fullName || 'Unknown User',
        action: notifType.type
      }
    };
    
    notifications.push(notification);
  }
  
  await Notification.insertMany(notifications);
  console.log(`✅ Added ${notifications.length} fake notifications for Mario Giuseppe`);
}

async function checkResults() {
  console.log('\n📊 Checking results for Mario Giuseppe...');
  
  // Count unread messages
  const totalUnread = await Message.countDocuments({
    receiver: MARIO_GIUSEPPE_ID,
    isRead: false,
    isDeleted: false
  });
  
  const orderUnread = await Message.countDocuments({
    receiver: MARIO_GIUSEPPE_ID,
    isRead: false,
    isDeleted: false,
    order: { $ne: null }
  });
  
  const chatUnread = totalUnread - orderUnread;
  
  // Count unread notifications
  const unreadNotifications = await Notification.countDocuments({
    recipient: MARIO_GIUSEPPE_ID,
    isRead: false
  });
  
  console.log(`📱 Total unread messages: ${totalUnread}`);
  console.log(`📦 Order unread messages: ${orderUnread}`);
  console.log(`💬 Chat unread messages: ${chatUnread}`);
  console.log(`🔔 Unread notifications: ${unreadNotifications}`);
  
  console.log('\n🎯 Expected badge counts:');
  console.log(`   Orders tab: ${orderUnread}`);
  console.log(`   Chat tab: ${chatUnread}`);
}

async function main() {
  try {
    console.log('🍕 Adding fake data for Mario Giuseppe (6870a1033a695f44a26f1f07)...\n');
    
    await clearExistingData();
    await addFakeMessages();
    await addFakeNotifications();
    await checkResults();
    
    console.log('\n✅ All done! Refresh your app to see the notifications.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

main(); 