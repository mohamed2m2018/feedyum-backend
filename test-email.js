// Test email connection
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('=== Email Configuration ===');
    console.log('HOST:', process.env.EMAIL_HOST);
    console.log('PORT:', process.env.EMAIL_PORT);
    console.log('USER:', process.env.EMAIL_USER);
    console.log('PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
    console.log('FROM:', process.env.EMAIL_FROM);
    console.log('');

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.zoho.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debug output
        logger: true // Log to console
    });

    console.log('=== Verifying Connection ===');
    try {
        await transporter.verify();
        console.log('✅ Connection verified successfully!');
    } catch (error) {
        console.error('❌ Connection verification failed:', error.message);
        return;
    }

    console.log('');
    console.log('=== Sending Test Email ===');
    try {
        const result = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'FeedYum <info@feedyum.com>',
            to: 'mohamed2m2018@gmail.com',
            subject: 'FeedYum Test Email - ' + new Date().toISOString(),
            text: 'This is a test email from FeedYum password reset system.',
            html: '<h1>Test Email</h1><p>This is a test email from FeedYum password reset system.</p>',
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('Response:', result.response);
        console.log('Accepted:', result.accepted);
        console.log('Rejected:', result.rejected);
    } catch (error) {
        console.error('❌ Email sending failed:', error);
    }
}

testEmail();
