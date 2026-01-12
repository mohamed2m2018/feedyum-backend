const mongoose = require('mongoose');
const { mongoURI } = require('./config/keys');
const EnhancedNotificationService = require('./services/enhancedNotificationService');
const sendNotification = require('./controllers/notificationController/sendNotification');

// DATA FROM PREVIOUS STEP
const TARGET_USER_ID = "695d4466503c8d9704ccd74c";
const SENDER_ID = "686c07e8643281d2101d66e6"; // Using the sender ID found earlier
const TARGET_POST_ID = "695d54b2503c8d9704cd0853";
const TARGET_COMMENT_ID = "695d45be503c8d9704ccdd5f";
const COMMENT_POST_ID = "695d4500503c8d9704ccdd2c";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            // 1. TRIGGER CHAT NOTIFICATION
            console.log('--- Triggering CHAT Notification ---');
            await EnhancedNotificationService.sendChatNotification({
                recipientId: TARGET_USER_ID,
                senderId: SENDER_ID,
                senderName: "Test Sender (Chat)",
                message: "Final verification: Chat notification test.",
                chatId: SENDER_ID
            });

            // 2. TRIGGER LIKE NOTIFICATION
            console.log('--- Triggering LIKE Notification ---');
            const mockPost = {
                _id: TARGET_POST_ID,
                title: "Your Awesome Post",
                author: { _id: TARGET_USER_ID },
                likesNo: 11
            };
            await sendNotification(TARGET_USER_ID, "Final verification: Like notification test", mockPost);


            // 3. TRIGGER REPLY NOTIFICATION 
            console.log('--- Triggering REPLY Notification ---');
            const replyMessage = `Final verification: Reply to your comment.`;
            const replyData = {
                type: 'reply',
                postId: COMMENT_POST_ID,
                commentId: TARGET_COMMENT_ID,
                replyId: new mongoose.Types.ObjectId().toString(),
                openComment: true
            };
            await sendNotification(TARGET_USER_ID, replyMessage, replyData);

            console.log('--- DONE ---');

        } catch (err) {
            console.error('Error triggering notifications:', err);
        } finally {
            setTimeout(() => {
                mongoose.disconnect();
                console.log('Disconnected');
            }, 2000);
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
