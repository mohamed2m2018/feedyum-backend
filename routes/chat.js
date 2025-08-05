const express = require('express');
const router = express.Router();
const passport = require('passport');
const Message = require('../models/message');
const User = require('../models/user');
const Order = require('../models/order');
const messagesController = require('../controllers/messagesController');

// Middleware to get current user ID from authenticated user
const getCurrentUserId = (req) => req.user?._id;

// Route to get unread message counts
router.get('/unread-counts', 
  passport.authenticate('jwt', { session: false }),
  messagesController.getUnreadCounts
);

// Route to mark a specific message as read
router.put('/messages/:messageId/read', 
  passport.authenticate('jwt', { session: false }),
  messagesController.markMessageAsRead
);

// Route to mark all messages from a specific sender as read
router.put('/chats/:senderId/read', 
  passport.authenticate('jwt', { session: false }),
  messagesController.markChatAsRead
);

// Route to get order-based chats for the current user
router.get('/order-chats', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getCurrentUserId(req);

    try {
        console.log('Order-chats: Fetching for user:', userId);
        
        // Get all orders for the current user (as customer)
        const userOrders = await Order.find({ user: userId })
            .populate('chef', 'fullName username avatar')
            .sort({ created_at: -1 })
            .lean();

        console.log('Order-chats: Found orders count:', userOrders.length);

        // Get latest message for each order (only order-specific messages)
        const orderChats = await Promise.all(
            userOrders.map(async (order) => {
                const latestMessage = await Message.findOne({
                    $and: [
                        {
                            $or: [
                                { sender: userId, receiver: order.chef._id },
                                { sender: order.chef._id, receiver: userId }
                            ]
                        },
                        { order: order._id } // Only order-specific messages
                    ]
                })
                .sort({ timestamp: -1 })
                .lean();

                console.log(`Order-chats: Order ${order._id} has message:`, !!latestMessage);

                return {
                    orderId: order._id,
                    order: order,
                    chef: order.chef,
                    latestMessage: latestMessage
                };
            })
        );

        // Sort by latest message timestamp
        orderChats.sort((a, b) => {
            const aTime = a.latestMessage?.timestamp ? new Date(a.latestMessage.timestamp) : new Date(a.order.created_at);
            const bTime = b.latestMessage?.timestamp ? new Date(b.latestMessage.timestamp) : new Date(b.order.created_at);
            return bTime - aTime;
        });

        console.log('Order-chats: Returning chats count:', orderChats.length);

        res.status(200).json({
            orderChats,
            totalChats: orderChats.length
        });
    } catch (error) {
        console.error('Get order chats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get all unique chat participants for the current user with pagination
router.get('/chats', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getCurrentUserId(req);
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    try {
        const sentMessages = await Message.find({ sender: userId }).distinct('receiver');
        const receivedMessages = await Message.find({ receiver: userId }).distinct('sender');

        const chatUserIds = Array.from(new Set([...sentMessages, ...receivedMessages]));

        const totalChats = chatUserIds.length;
        const totalPages = Math.ceil(totalChats / pageSize);

        const chatUsers = await User.find({ _id: { $in: chatUserIds } })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();

        const recentChats = await Promise.all(chatUsers.map(async (user) => {
            const latestMessage = await Message.findOne({
                $or: [
                    { sender: userId, receiver: user._id },
                    { sender: user._id, receiver: userId }
                ]
            }).sort({ timestamp: -1 }).lean();
            return {
                ...user,
                latestMessage: {
                    content: latestMessage?.content || '',
                    timestamp: latestMessage?.timestamp || ''
                }
            };
        }));

        recentChats.sort((a, b) => new Date(b.latestMessage.timestamp) - new Date(a.latestMessage.timestamp));

        res.status(200).json({
            chatUsers: recentChats,
            totalPages,
            currentPage: pageNumber,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get all messages for the current user (with optional chat user and order filtering and pagination)
router.get('/messages', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getCurrentUserId(req);
    const { chatUserId, orderId, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    try {
        let query = {
            $or: [
                { sender: userId, receiver: chatUserId },
                { sender: chatUserId, receiver: userId }
            ]
        };

        // If orderId is provided, filter messages for that specific order only
        if (orderId) {
            query = {
                $and: [
                    {
                        $or: [
                            { sender: userId, receiver: chatUserId },
                            { sender: chatUserId, receiver: userId }
                        ]
                    },
                    { order: orderId } // Only order-specific messages
                ]
            };
        }

        if (!chatUserId) {
            query.$or = [{ sender: userId }, { receiver: userId }];
        }

        const messages = await Message.find(query)
            .sort({ timestamp: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .populate('sender receiver', 'username avatar fullName')
            .populate('order', 'status created_at');

        const totalMessages = await Message.countDocuments(query);
        const totalPages = Math.ceil(totalMessages / pageSize);

        res.status(200).json({
            messages,
            totalPages,
            currentPage: pageNumber,
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to initiate a chat (if needed)
router.post('/initiate', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId1 = getCurrentUserId(req);
    const { userId2, message, orderId } = req.body;

    try {
        // Check if any messages exist between the two users
        const existingMessages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        });

        if (existingMessages.length === 0) {
            // No chat session exists, so create an initial message
            const newMessage = new Message({
                sender: userId1,
                receiver: userId2,
                content: message,
                order: orderId || null,
                timestamp: new Date()
            });
            await newMessage.save();
            return res.status(200).json({ message: 'New chat session initiated and message sent' });
        }

        res.status(200).json({ message: 'Chat session already exists' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to post a message
router.post('/message', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getCurrentUserId(req);
    const { chatUserId, content, orderId } = req.body;

    try {
        const newMessage = new Message({
            sender: userId,
            receiver: chatUserId,
            content,
            order: orderId || null,
            timestamp: new Date()
        });
        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to delete a message
router.delete('/message/:messageId', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getCurrentUserId(req);
    const { messageId } = req.params;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Only sender can delete their message
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }

        if (message.isDeleted) {
            return res.status(400).json({ error: 'Message is already deleted' });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});



module.exports = router;
