const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');

// Middleware to get current user ID from req.user._id
const getCurrentUserId = (req) => req.user?._id;

// Route to get all messages for the current user (with optional chat user filtering and pagination)
router.get('/messages', async (req, res) => {
    const userId = getCurrentUserId(req);
    const { chatUserId, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    try {
        const query = {
            $or: [
                { sender: userId, receiver: chatUserId },
                { sender: chatUserId, receiver: userId }
            ]
        };
        if (!chatUserId) {
            query.$or = [{ sender: userId }, { receiver: userId }];
        }

        const messages = await Message.find(query)
            .sort({ timestamp: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .populate('sender receiver', 'username');

        const totalMessages = await Message.countDocuments(query);
        const totalPages = Math.ceil(totalMessages / pageSize);

        res.status(200).json({
            messages,
            totalPages,
            currentPage: pageNumber,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get all unique chat participants for the current user with pagination
router.get('/chats', async (req, res) => {
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

        const chatUsers = await User.find({ _id: { $in: chatUserIds } }, 'username')
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        res.status(200).json({
            chatUsers,
            totalPages,
            currentPage: pageNumber,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to initiate a chat (if needed)
router.post('/initiate', async (req, res) => {
    const userId1 = getCurrentUserId(req);
    const { userId2, message } = req.body;
    
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
router.post('/message', async (req, res) => {
    const userId = getCurrentUserId(req);
    const { chatUserId, content } = req.body;

    try {
        const newMessage = new Message({
            sender: userId,
            receiver: chatUserId,
            content,
            timestamp: new Date()
        });
        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
