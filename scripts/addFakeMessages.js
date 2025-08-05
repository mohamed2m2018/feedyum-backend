const mongoose = require('mongoose');
const mongoURI = require('../config/keys').mongoURI;

// Load models
require('../models/loadModels');
const Message = require('../models/message');
const User = require('../models/user');
const Order = require('../models/order');

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected for fake messages'))
.catch(err => console.log('Error connecting to database:', err));

const fakeMessageTexts = [
  "Hey! How are you doing?",
  "Thanks for the amazing food yesterday!",
  "When will my order be ready?",
  "Can you add extra sauce to my order?",
  "Your restaurant has the best shawarma in town! 🌯",
  "I'd like to cancel my order, please",
  "Could you deliver to a different address?",
  "The food was absolutely delicious! Will order again 😋",
  "Is it possible to get a refund?",
  "Can you recommend something spicy?",
  "What time do you close today?",
  "Do you have any vegetarian options?",
  "The delivery was super fast! Thank you 🚗",
  "Can I pay with cash on delivery?",
  "Your customer service is excellent! 👍",
  "Is the kitchen still open?",
  "Can you make it less spicy, please?",
  "I love your new menu items!",
  "The packaging was perfect, no spills 📦",
  "Can I order for tomorrow?",
  "Your chef is amazing! Compliments to the kitchen 👨‍🍳",
  "Is there a discount for bulk orders?",
  "The portion size was perfect!",
  "Can you add my order to favorites?",
  "Thank you for the quick response!",
];

const addFakeMessages = async () => {
  try {
    console.log('Starting to add fake messages...');

    // Get users from the database
    const users = await User.find().limit(15);
    if (users.length < 2) {
      console.log('Need at least 2 users in database. Please add some users first.');
      return;
    }

    console.log(`Found ${users.length} users in database`);

    // Get some orders for order-related messages
    const orders = await Order.find().limit(10);
    console.log(`Found ${orders.length} orders in database`);

    const messagesToCreate = [];

    // Create conversations between random users
    for (let i = 0; i < users.length; i++) {
      const currentUser = users[i];
      
      // Create 2-4 conversations per user
      const numConversations = Math.floor(Math.random() * 3) + 2;
      
      for (let conv = 0; conv < numConversations; conv++) {
        // Pick a random other user to chat with
        let otherUser;
        do {
          otherUser = users[Math.floor(Math.random() * users.length)];
        } while (otherUser._id.equals(currentUser._id));

        // Create 3-8 messages in this conversation
        const numMessages = Math.floor(Math.random() * 6) + 3;
        
        for (let msg = 0; msg < numMessages; msg++) {
          const isFromCurrentUser = Math.random() > 0.5;
          const sender = isFromCurrentUser ? currentUser : otherUser;
          const receiver = isFromCurrentUser ? otherUser : currentUser;
          
          // 30% chance of being order-related
          const isOrderRelated = Math.random() < 0.3 && orders.length > 0;
          const order = isOrderRelated ? orders[Math.floor(Math.random() * orders.length)] : null;
          
          // 70% chance of being unread (for testing badges)
          const isRead = Math.random() < 0.3;
          
          // Random message text
          const messageText = fakeMessageTexts[Math.floor(Math.random() * fakeMessageTexts.length)];
          
          // Random timestamp in the last 24 hours
          const hoursAgo = Math.floor(Math.random() * 24);
          const minutesAgo = Math.floor(Math.random() * 60);
          const timestamp = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
          
          const message = {
            sender: sender._id,
            receiver: receiver._id,
            content: messageText,
            messageType: 'text',
            isRead: isRead,
            readAt: isRead ? new Date(timestamp.getTime() + 5 * 60 * 1000) : null, // Read 5 minutes after sent
            timestamp: timestamp,
            order: order ? order._id : null,
            isDeleted: false,
          };

          messagesToCreate.push(message);
        }
      }
    }

    // Add some audio messages for variety
    const audioMessages = Math.floor(messagesToCreate.length * 0.1); // 10% audio messages
    for (let i = 0; i < audioMessages; i++) {
      const randomIndex = Math.floor(Math.random() * messagesToCreate.length);
      messagesToCreate[randomIndex] = {
        ...messagesToCreate[randomIndex],
        messageType: 'audio',
        content: '', // Audio messages have empty content
        audio: `https://example.com/audio/voice_message_${Date.now()}.mp3`,
        duration: Math.floor(Math.random() * 30) + 5, // 5-35 seconds
      };
    }

    console.log(`Preparing to create ${messagesToCreate.length} messages...`);

    // Clear existing messages first (optional)
    const existingCount = await Message.countDocuments();
    console.log(`Found ${existingCount} existing messages`);
    
    if (existingCount > 0) {
      console.log('Clearing existing messages...');
      await Message.deleteMany({});
      console.log('Existing messages cleared');
    }

    // Insert all messages
    const createdMessages = await Message.insertMany(messagesToCreate);
    
    console.log(`✅ Successfully created ${createdMessages.length} fake messages!`);

    // Show summary
    const unreadCount = await Message.countDocuments({ isRead: false });
    const readCount = await Message.countDocuments({ isRead: true });
    const orderMessages = await Message.countDocuments({ order: { $ne: null } });
    const audioMessagesCount = await Message.countDocuments({ messageType: 'audio' });
    
    console.log('\n📊 Summary:');
    console.log(`- Total messages: ${createdMessages.length}`);
    console.log(`- Unread: ${unreadCount}`);
    console.log(`- Read: ${readCount}`);
    console.log(`- Order-related: ${orderMessages}`);
    console.log(`- Audio messages: ${audioMessagesCount}`);
    
    // Show unread counts by user
    const unreadByUser = await Message.aggregate([
      { $match: { isRead: false } },
      { 
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      { $unwind: '$receiverInfo' },
      {
        $group: {
          _id: '$receiver',
          userName: { $first: '$receiverInfo.fullName' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('\n📱 Top users with unread messages:');
    unreadByUser.forEach(user => {
      console.log(`- ${user.userName}: ${user.count} unread`);
    });

    console.log('\n🎉 Fake messages added successfully!');
    console.log('You can now test the message notification badges in the app.');

  } catch (error) {
    console.error('❌ Error adding fake messages:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the script
addFakeMessages(); 