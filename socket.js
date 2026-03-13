const socketIo = require('socket.io');
const Message = require('./models/message');
const Order = require('./models/order');

console.log('✅ socket.js loaded with Push Notification support'); // Startup check

// Helper function to get all badge counts for a user (chat unread + order unseen)
const getBadgeCounts = async (userId) => {
    try {
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get total unread messages count
        const totalUnreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false,
            isDeleted: false
        });

        // Get order-related unread messages count
        const orderUnreadCount = await Message.countDocuments({
            receiver: userId,
            isRead: false,
            isDeleted: false,
            order: { $ne: null }
        });

        // Calculate chat unread count (non-order messages)
        const chatUnreadCount = totalUnreadCount - orderUnreadCount;

        // Get unseen orders count (active orders with status changes user hasn't seen)
        // Only count orders with lastUpdated field (not old orders without it)
        const orders = await Order.find({
            user: userObjectId,
            status: { $nin: ['cancelled', 'delivered', 'completed'] },
            lastUpdated: { $exists: true, $ne: null }
        }).select('lastUpdated userLastSeenAt').lean();

        const unseenOrdersCount = orders.filter(order => {
            if (!order.userLastSeenAt) return true; // Never seen
            return new Date(order.lastUpdated) > new Date(order.userLastSeenAt);
        }).length;

        return {
            totalUnreadCount,
            orderUnreadCount,
            chatUnreadCount,
            unseenOrdersCount
        };
    } catch (error) {
        console.error('Error getting badge counts:', error);
        return { totalUnreadCount: 0, orderUnreadCount: 0, chatUnreadCount: 0, unseenOrdersCount: 0 };
    }
};

// Export helper for use by other modules  — attached AFTER main export to avoid being overwritten
// Store io instance for use by other modules
let ioInstance = null;

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*", // Adjust this as needed for your environment
            methods: ["GET", "POST"]
        }
    });

    // Store io instance globally for access by routes
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('join', async ({ userId, chatUserId, orderId, page = 1, limit = 10 }) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);

            const pageNumber = parseInt(page);
            const pageSize = parseInt(limit);

            try {
                let query = {
                    $or: [
                        { sender: userId, receiver: chatUserId },
                        { sender: chatUserId, receiver: userId }
                    ]
                };

                // If orderId is provided, filter messages for that specific order or general messages between users
                if (orderId) {
                    query = {
                        $and: [
                            {
                                $or: [
                                    { sender: userId, receiver: chatUserId },
                                    { sender: chatUserId, receiver: userId }
                                ]
                            },
                            {
                                $or: [
                                    { order: orderId }, // Order-specific messages
                                    { order: null } // General messages between these users
                                ]
                            }
                        ]
                    };
                }

                const messages = await Message.find(query)
                    .sort({ timestamp: -1 })
                    .skip((pageNumber - 1) * pageSize)
                    .limit(pageSize)
                    .populate('sender', 'username avatar fullName') // Assuming avatar field is available
                    .populate('receiver', 'username avatar fullName') // Assuming avatar field is available
                    .populate('order', 'status created_at');

                const totalMessages = await Message.countDocuments(query);
                const totalPages = Math.ceil(totalMessages / pageSize);

                socket.emit('chatHistory', {
                    messages,
                    totalPages,
                    currentPage: pageNumber,
                });

                // Send initial badge counts to the user
                const badgeCounts = await getBadgeCounts(userId);
                socket.emit('badgeCountsUpdate', badgeCounts);

            } catch (error) {
                console.error('Error fetching chat history:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        socket.on('sendMessage', async (data, callback) => {
            const { senderId, receiverId, content, audio, duration, orderId } = data;

            // Create message object based on type
            const messageData = {
                sender: senderId,
                receiver: receiverId,
                order: orderId || null, // Link message to order if provided
                timestamp: new Date()
            };

            if (audio) {
                // Audio message
                messageData.audio = audio;
                messageData.duration = duration;
                messageData.messageType = 'audio';
                messageData.content = ''; // Audio messages have empty content
            } else {
                // Text message
                messageData.content = content;
                messageData.messageType = 'text';
            }

            try {
                const savedMessage = await Message.create(messageData); // Changed from message.save() to Message.create(messageData)
                console.log(`Message saved: ${savedMessage._id}`);

                // Populate sender and receiver info for socket emission and notifications
                const populatedMessage = await Message.findById(savedMessage._id)
                    .populate('sender', 'username avatar fullName') // Assuming avatar field is available
                    .populate('receiver', 'username avatar fullName') // Assuming avatar field is available
                    .populate('order', 'status created_at');

                io.to(receiverId).emit('newMessage', populatedMessage);
                io.to(senderId).emit('newMessage', populatedMessage); // Send to sender to avoid frontend handling

                // Send updated badge counts to receiver
                const receiverBadgeCounts = await getBadgeCounts(receiverId);
                io.to(receiverId).emit('badgeCountsUpdate', receiverBadgeCounts);

                // --- PUSH NOTIFICATION INTEGRATION ---
                try {
                    // Get sender details (if not fully populated or to ensure we have them)
                    // The populatedMessage already has sender info but let's be safe
                    const senderInfo = populatedMessage.sender;
                    console.log(`Sender info found: ${senderInfo ? 'yes' : 'no'} - ID: ${senderInfo?._id}`);

                    if (senderInfo) {
                        const EnhancedNotificationService = require('./services/enhancedNotificationService');
                        console.log('Calling EnhancedNotificationService.sendChatNotification...');

                        await EnhancedNotificationService.sendChatNotification({
                            recipientId: receiverId.toString(),
                            senderId: senderId.toString(),
                            senderName: senderInfo.fullName || senderInfo.username || 'User',
                            message: messageData.messageType === 'text' ? content : '',
                            chatId: senderId.toString(),
                            senderAvatar: senderInfo.avatar,
                            messageType: messageData.messageType,
                            orderId: messageData.order // Pass orderId if available (it was saved as message.order)
                        });
                        console.log(`Socket: Chat notification sent from ${senderId} to ${receiverId}`);
                    } else {
                        console.log('Sender info missing, skipping notification');
                    }
                } catch (notifError) {
                    console.error('Socket: Failed to send chat notification:', notifError);
                    // Don't fail the message flow for notification failure
                }
                // -------------------------------------

                if (typeof callback === 'function') {
                    callback({ success: true, message: populatedMessage });
                }
            } catch (error) {
                console.error('Error sending message:', error);
                if (typeof callback === 'function') {
                    callback({ error: 'Message not sent' });
                }
            }
        });

        // Handle marking messages as read
        socket.on('markMessagesRead', async (data) => {
            const { userId, senderId, orderId } = data;

            try {
                let query = {
                    sender: senderId,
                    receiver: userId,
                    isRead: false,
                    isDeleted: false
                };

                // If orderId is provided, only mark order-specific messages as read
                if (orderId) {
                    query.order = orderId;
                }

                await Message.updateMany(query, {
                    isRead: true,
                    readAt: new Date()
                });

                // Send updated badge counts to user
                const badgeCounts = await getBadgeCounts(userId);
                io.to(userId).emit('badgeCountsUpdate', badgeCounts);

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};

module.exports = initSocket;
module.exports.getBadgeCounts = getBadgeCounts;
module.exports.getIO = () => ioInstance;
