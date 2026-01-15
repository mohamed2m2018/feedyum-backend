const mongoose = require('mongoose');
const User = require('../models/User');
const Dish = require('../models/Dish');
const Order = require('../models/Order');
const EnhancedNotificationService = require('../services/enhancedNotificationService');
const keys = require('../config/keys');

// Connect to MongoDB
mongoose.connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const triggerTest = async () => {
    try {
        console.log('Searching for users...');

        // 1. Find Chef (mohamed2m2024...)
        const chef = await User.findOne({ email: { $regex: '^mohamed2m2024', $options: 'i' } });
        if (!chef) {
            console.error('Chef user (mohamed2m2024) not found!');
            process.exit(1);
        }
        console.log(`Found Chef: ${chef.fullName} (${chef.email}) - ID: ${chef._id}`);

        // 2. Find Customer (mohamed2m2018...)
        const customer = await User.findOne({ email: { $regex: '^mohamed2m2018', $options: 'i' } });
        if (!customer) {
            console.error('Customer user (mohamed2m2018) not found!');
            process.exit(1);
        }
        console.log(`Found Customer: ${customer.fullName} (${customer.email}) - ID: ${customer._id}`);

        // 3. Find a Dish by Chef
        const dish = await Dish.findOne({ user_id: chef._id });
        if (!dish) {
            console.error('No dish found for this chef!');
        }
        const dishName = dish ? dish.name : 'Test Dish';
        const dishPrice = dish ? (dish.price || 100) : 100;
        console.log(`Found Dish: ${dishName} - Price: ${dishPrice}`);

        // 4. Create Order
        const newOrder = new Order({
            user: customer._id,
            chef: chef._id,
            items: [{
                dish: dish ? dish._id : new mongoose.Types.ObjectId(),
                quantity: 1
            }],
            totalPrice: dishPrice,
            subtotal: dishPrice,
            status: 'pending', // Initial status
            paymentMethod: 'cash',
            deliveryAddress: {
                nameLine: 'Test User',
                location: {
                    lat: '30.0444',
                    long: '31.2357'
                },
                isPrimary: true
            }
        });

        const savedOrder = await newOrder.save();
        console.log(`Order Created: ${savedOrder._id}`);

        // 5. Trigger Notification
        // Use sendNewOrderNotification as if it came from the controller
        console.log('Sending Notification...');

        const response = await EnhancedNotificationService.sendNewOrderNotification({
            chefId: chef._id.toString(),
            orderId: savedOrder._id.toString(),
            customerName: customer.fullName || 'Unknown Customer',
            orderTotal: dishPrice,
            itemCount: 1,
            customerAvatar: customer.photo || null
        });

        console.log('Notification Response:', JSON.stringify(response, null, 2));
        if (response.recipients === 0) {
            console.error('⛔ WARNING: Notification sent to 0 recipients! Check if user is subscribed.');
        } else {
            console.log(`✅ Sent to ${response.recipients} recipients.`);
        }
        console.log('-----------------------------------');
        console.log('SUCCESS: Notification sent. Check the device.');

    } catch (error) {
        console.error('Error triggering notification:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

triggerTest();
