
const mongoose = require('mongoose');
const User = require('../models/user');
// We need to define the schema if it's not already registered, or just retrieve it if it is.
// Since we are running a standalone script, we should require the model definition directly or define a mock if needed.
// Best approach: Require the model file.
const ChefBranch = require('../models/chefBranch');

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

        const branches = await ChefBranch.find({ chef: chef._id });
        console.log(`Found ${branches.length} branches.`);
        console.log('Chef Branches:', JSON.stringify(branches, null, 2));

        if (branches.length === 0) {
            console.log('No branches found for this chef.');
        } else {
             branches.forEach(b => {
                 console.log(`Branch City: "${b.addressDetails?.city}"`);
             });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
