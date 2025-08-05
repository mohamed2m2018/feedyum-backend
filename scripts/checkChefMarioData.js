const mongoose = require('mongoose');
require('../models/loadModels');
const User = require('../models/user');
const Message = require('../models/message');
const Notification = require('../models/notification');

mongoose.connect(require('../config/keys').mongoURI)
.then(async () => {
  console.log('🔍 Checking data for Chef Mario...\n');
  
  // Find Chef Mario
  const mario = await User.findOne({fullName: /mario/i});
  if (!mario) {
    console.log('❌ Chef Mario not found');
    
    // Show all users
    const users = await User.find({}, 'fullName username type').limit(10);
    console.log('\n📋 Available users:');
    users.forEach(user => {
      console.log(`- ${user.fullName} (@${user.username}) - ${user.type}`);
    });
    return;
  }
  
  console.log('👨‍🍳 Found Chef Mario:');
  console.log('- ID:', mario._id);
  console.log('- Name:', mario.fullName);
  console.log('- Username:', mario.username);
  console.log('- Type:', mario.type);
  console.log();
  
  // Check messages
  const totalMessages = await Message.countDocuments({
    receiver: mario._id
  });
  
  const unreadMessages = await Message.countDocuments({
    receiver: mario._id,
    isRead: false
  });
  
  const orderMessages = await Message.countDocuments({
    receiver: mario._id,
    isRead: false,
    order: { $ne: null }
  });
  
  console.log('💬 Message counts:');
  console.log('- Total messages:', totalMessages);
  console.log('- Total unread messages:', unreadMessages);
  console.log('- Order-related unread:', orderMessages);
  console.log('- Chat unread (non-order):', unreadMessages - orderMessages);
  console.log();
  
  // Check notifications
  const totalNotifications = await Notification.countDocuments({
    recipient: mario._id
  });
  
  const unreadNotifications = await Notification.countDocuments({
    recipient: mario._id,
    isRead: false
  });
  
  console.log('🔔 Notification counts:');
  console.log('- Total notifications:', totalNotifications);
  console.log('- Total unread notifications:', unreadNotifications);
  console.log();
  
  // Show recent unread messages
  const recentMessages = await Message.find({
    receiver: mario._id,
    isRead: false
  }).populate('sender', 'fullName').sort({timestamp: -1}).limit(5);
  
  console.log('📝 Recent unread messages:');
  if (recentMessages.length === 0) {
    console.log('- No unread messages found');
  } else {
    recentMessages.forEach(msg => {
      const orderInfo = msg.order ? ' [ORDER]' : '';
      console.log(`- From ${msg.sender.fullName}${orderInfo}: ${msg.content.substring(0, 50)}...`);
    });
  }
  console.log();
  
  // Show recent unread notifications
  const recentNotifications = await Notification.find({
    recipient: mario._id,
    isRead: false
  }).populate('sender', 'fullName').sort({createdAt: -1}).limit(5);
  
  console.log('🔔 Recent unread notifications:');
  if (recentNotifications.length === 0) {
    console.log('- No unread notifications found');
  } else {
    recentNotifications.forEach(notif => {
      console.log(`- ${notif.type}: ${notif.message.substring(0, 60)}...`);
    });
  }
  
  console.log('\n🎯 Expected badge counts for Chef Mario:');
  console.log(`- Orders tab badge: ${orderMessages}`);
  console.log(`- Chat tab badge: ${unreadMessages - orderMessages}`);
  
  mongoose.disconnect();
})
.catch(err => {
  console.error('❌ Error:', err);
  mongoose.disconnect();
}); 