
const mongoose = require('mongoose');
const User = require('../models/user');
// Register models
require('../models/chefBranch');

const mongoURI = 'mongodb+srv://mohamed2m2018:22233322@cookbook.oogokbq.mongodb.net/foodtok?retryWrites=true&w=majority';

// Mock request/response to call the controller directly or just use Mongoose logic to simulate
// Actually, since I modified the controller, I need to call the controller or replicate the logic.
// The easiest way to fix the *existing* data is to just run a one-time migration script that does exactly what the controller does.
// The Controller change fixes *future* updates.
// The User needs the *existing* data fixed NOW.

const fixDirectly = async () => {
     try {
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const ChefBranch = mongoose.model('chefBranch');
        const chef = await User.findOne({ email: 'testchef@foodtok.com' });
        
        if (!chef || chef.type !== 'chef') {
            console.log('Chef not found or not a chef');
            return;
        }
        
        console.log(`Fixing branches for chef: ${chef._id}`);
        
        // locations
        const locationData = chef.locations;
        console.log('Locations:', JSON.stringify(locationData, null, 2));
        
        if (!locationData || locationData.length === 0) {
            console.log('No locations to sync');
            return;
        }

        // 1. Remove all existing branches
        await ChefBranch.deleteMany({ chef: chef._id });
        
        const branchesToCreate = [];
        
        // 2. Create new branches
        for (const loc of locationData) {
            const parts = loc.description.split(',').map(p => p.trim());
            let city = 'Unknown';
            let country = 'Unknown';
            
            if (parts.length >= 2) {
                country = parts[parts.length - 1];
                const possibleCity = parts[parts.length - 2];
                if (!isNaN(possibleCity) && parts.length >= 3) { 
                   city = parts[parts.length - 3];
                } else {
                    city = possibleCity; // e.g. Cairo
                }
            } else if (parts.length === 1) {
                city = parts[0];
            }

            // Cleanup city "Cairo" -> "Cairo"
            // "11765" check handles zip codes
            
            console.log(`Parsed: City=${city}, Country=${country} from "${loc.description}"`);

            branchesToCreate.push({
              chef: chef._id,
              branchName: city + ' Branch',
              addressDetails: {
                formattedAddress: loc.description,
                city: city,
                country: country
              },
              location: {
                lat: loc.lat,
                long: loc.long
              },
              contactInfo: {
                phoneNumber: chef.phone || 'N/A',
                countryCode: '+20' 
              },
              operatingHours: [
                { day: 'monday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
                { day: 'tuesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
                { day: 'wednesday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
                { day: 'thursday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
                { day: 'friday', isOpen: true, openTime: '13:00', closeTime: '23:00' },
                { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '23:00' },
                { day: 'sunday', isOpen: true, openTime: '09:00', closeTime: '22:00' }
              ],
              isActive: true,
              isPrimary: branchesToCreate.length === 0
            });
        }
        
        if (branchesToCreate.length > 0) {
            await ChefBranch.insertMany(branchesToCreate);
            console.log(`Successfully created ${branchesToCreate.length} branches.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixDirectly();
