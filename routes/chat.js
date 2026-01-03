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

            // Get all orders for the current user (as customer OR chef)
            const userOrders = await Order.find({
                $or: [
                    { user: userId },
                    { chef: userId }
                ]
            })
                .populate('chef', 'fullName username avatar')
                .populate('user', 'fullName username avatar')
                .sort({ created_at: -1 })
                .lean();

            console.log('Order-chats: Found orders count:', userOrders.length);

            // Get latest message for each order (only order-specific messages)
            const orderChats = await Promise.all(
                userOrders.map(async (order) => {
                    // Determine the other party (chat partner)
                    // If current user is the chef, the partner is the user (customer)
                    // If current user is the user (customer), the partner is the chef
                    const isCurrentUserChef = order.chef && order.chef._id.toString() === userId.toString();
                    const chatPartner = isCurrentUserChef ? order.user : order.chef;

                    // If partner is missing (e.g. deleted user), handle gracefully
                    if (!chatPartner) {
                        console.log(`Order-chats: Missing partner for order ${order._id}`);
                        return null;
                    }

                    const latestMessage = await Message.findOne({
                        $and: [
                            {
                                $or: [
                                    { sender: userId, receiver: chatPartner._id },
                                    { sender: chatPartner._id, receiver: userId }
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
                        chef: chatPartner, // Mapping 'chef' to the chat partner for frontend compatibility
                        latestMessage: latestMessage
                    };
                })
            );

            // Filter out nulls
            const validChats = orderChats.filter(chat => chat !== null);

            // Sort by latest message timestamp
            // Sort by latest message timestamp
            validChats.sort((a, b) => {
                const aTime = a.latestMessage?.timestamp ? new Date(a.latestMessage.timestamp) : new Date(a.order.created_at);
                const bTime = b.latestMessage?.timestamp ? new Date(b.latestMessage.timestamp) : new Date(b.order.created_at);
                return bTime - aTime;
            });

            console.log('Order-chats: Returning chats count:', validChats.length);

            res.status(200).json({
                orderChats: validChats,
                totalChats: validChats.length
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
            const savedMessage = await newMessage.save();

            // Populate sender info for the response
            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('sender', 'username avatar fullName')
                .populate('receiver', 'username avatar fullName');

            // Emit socket event to notify receiver in real-time
            try {
                const socketModule = require('../socket');
                const io = socketModule.getIO();
                if (io) {
                    // Emit to receiver for real-time update
                    io.to(chatUserId.toString()).emit('newMessage', populatedMessage);
                    console.log(`[SOCKET] Emitted newMessage to receiver: ${chatUserId}`);
                }
            } catch (socketError) {
                console.error('[SOCKET] Failed to emit newMessage:', socketError.message);
                // Continue anyway - message is saved, just not real-time
            }

            res.status(201).json({
                success: true,
                message: populatedMessage // Return the actual message object
            });
        } catch (error) {
            console.error('Post message error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

// Route to edit a message
router.put('/message/:messageId',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const userId = getCurrentUserId(req);
        const { messageId } = req.params;
        const { content } = req.body;

        try {
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            // Only sender can edit their message
            if (message.sender.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'You can only edit your own messages' });
            }

            if (message.isDeleted) {
                return res.status(400).json({ error: 'Cannot edit a deleted message' });
            }

            // Update message content
            message.content = content;
            message.isEdited = true; // Add a flag to indicate it's been edited
            const savedMessage = await message.save();

            // Populate sender info for the response
            const populatedMessage = await Message.findById(savedMessage._id)
                .populate('sender', 'username avatar fullName')
                .populate('receiver', 'username avatar fullName');

            // Emit socket event to notify receiver in real-time
            try {
                const socketModule = require('../socket');
                const io = socketModule.getIO();
                if (io) {
                    // Emit to receiver and sender for real-time update
                    const chatUserId = message.receiver.toString() === userId.toString() ? message.sender.toString() : message.receiver.toString();
                    io.to(chatUserId).emit('messageUpdated', populatedMessage);
                    // Also emit to the sender's other devices if any
                    io.to(userId.toString()).emit('messageUpdated', populatedMessage);

                    console.log(`[SOCKET] Emitted messageUpdated for message: ${messageId}`);
                }
            } catch (socketError) {
                console.error('[SOCKET] Failed to emit messageUpdated:', socketError.message);
            }

            res.json({
                success: true,
                message: populatedMessage
            });
        } catch (error) {
            console.error('Edit message error:', error);
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
