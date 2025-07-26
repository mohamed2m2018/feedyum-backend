const socketIo = require('socket.io');
const Message = require('./models/message');

module.exports = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: "*", // Adjust this as needed for your environment
            methods: ["GET", "POST"]
        }
    });

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

            const message = new Message(messageData);

            try {
                const savedMessage = await message.save();
                const populatedMessage = await Message.findById(savedMessage._id)
                    .populate('sender', 'username avatar fullName') // Assuming avatar field is available
                    .populate('receiver', 'username avatar fullName') // Assuming avatar field is available
                    .populate('order', 'status created_at');
                
                io.to(receiverId).emit('newMessage', populatedMessage);
                io.to(senderId).emit('newMessage', populatedMessage); // Send to sender to avoid frontend handling
                callback({ success: true, message: populatedMessage });
            } catch (error) {
                console.error('Error sending message:', error);
                callback({ error: 'Message not sent' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
};
