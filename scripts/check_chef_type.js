
const mongoose = require('mongoose');
const User = require('../models/user');
// Model definition might be needed if not globally loaded, but User is standard.

const mongoURI = 'mongodb+srv://mohamed2m2018:22233322@cookbook.oogokbq.mongodb.net/foodtok?retryWrites=true&w=majority';

const run = async () => {
    try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const chef = await User.findOne({ email: 'testchef@foodtok.com' });
        if (!chef) {
            console.log('Chef not found');
            return;
        }
        console.log('Chef ID:', chef._id);
        console.log('Chef Type:', chef.type);
        console.log('Chef Locations:', JSON.stringify(chef.locations, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
