const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function sendTestMessage() {
    const userId = '696b6802166da7943b98b633'; // Mohamed Shoman 2
    const receiverId = '696698e88b16fb4e2c5f0d1e'; // mohamed2m2024
    const orderId = '697524d71be67045b6d612ee';

    // Generate token
    const token = jwt.sign({ id: userId, _id: userId }, process.env.SECRET_OR_KEY, { expiresIn: '1h' });
    console.log('Token generated');

    try {
        const response = await axios.post('http://localhost:4800/api/chat/message', {
            chatUserId: receiverId,
            content: 'Socket test: Real-time message via API - ' + new Date().toISOString(),
            orderId: orderId
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Message sent successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }

    process.exit(0);
}

sendTestMessage();
