const mongoose = require("mongoose");

// Models
const User = mongoose.model("user");
const ChefBranch = require('../../models/chefBranch'); // Import ChefBranch model

// Validations
const validateEditUser = require("../../validations/EditUser");

const updateUser = (req, res) => {
  // Validate
  const { errors, isValid } = validateEditUser(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Extract the location data from the request body
  const locationData = req.body.locations;

  User.findById(req.user._id.toString())
    .then((user) => {
      if (!user) {
        errors.error = "User not found";
        return res.status(404).json(errors);
      }
      

      user.locations = locationData;
      

      // Update other user fields as needed
      if(req.body.fullName){
        user.fullName = req.body.fullName;
      }
      if(req.body.phone){
        user.phone = req.body.phone;
      }
      if(req.body.userName){
        user.userName = req.body.userName;
      }
      if(req.body.email){
        user.email = req.body.email;
      }
      if(req.body.gender){
        user.gender = req.body.gender;
      }
      if(req.body.avatar){
        user.avatar = req.body.avatar;
      }
      if(req.body.type){
        user.type = req.body.type;
      }
      if(req.body.bio){
        user.bio = req.body.bio;
      }
      if(req.body.hasMenu){
        user.hasMenu = req.body.hasMenu;
      }
      if(req.body.chatEnabled !== undefined){
        user.chatEnabled = req.body.chatEnabled;
      }
      if(req.body.requireCustomerConfirmation !== undefined){
        if (!user.chefSettings) user.chefSettings = {};
        user.chefSettings.requireCustomerConfirmation = req.body.requireCustomerConfirmation;
        // Cascade: turning confirmation OFF disables deposit
        if (req.body.requireCustomerConfirmation === false) {
          user.chefSettings.requireDeposit = false;
        }
      }

      // Deposit configuration
      if (req.body.requireDeposit !== undefined) {
        if (!user.chefSettings) user.chefSettings = {};
        if (req.body.requireDeposit === true) {
          // Validate instapayHandle exists (from request or already saved)
          const instapay = req.body.instapayHandle?.trim() || user.chefSettings.instapayHandle;
          if (!instapay) {
            return res.status(400).json({
              message: 'InstaPay number is required to enable deposit',
              messageAr: 'رقم إنستاباي مطلوب لتفعيل العربون',
            });
          }
          // Force confirmation ON
          user.chefSettings.requireCustomerConfirmation = true;
        }
        user.chefSettings.requireDeposit = req.body.requireDeposit;
      }
      if (req.body.instapayHandle !== undefined) {
        if (!user.chefSettings) user.chefSettings = {};
        user.chefSettings.instapayHandle = req.body.instapayHandle.trim();
      }
      if (req.body.instapayType !== undefined) {
        if (!user.chefSettings) user.chefSettings = {};
        const validTypes = ['phone', 'handle'];
        if (validTypes.includes(req.body.instapayType)) {
          user.chefSettings.instapayType = req.body.instapayType;
        }
      }
      if (req.body.depositType !== undefined) {
        if (!user.chefSettings) user.chefSettings = {};
        const validTypes = ['percentage', 'fixed'];
        if (validTypes.includes(req.body.depositType)) {
          user.chefSettings.depositType = req.body.depositType;
        }
      }
      if (req.body.depositValue !== undefined) {
        if (!user.chefSettings) user.chefSettings = {};
        const val = Number(req.body.depositValue);
        if (val > 0) {
          // Clamp percentage to 1-100
          if (user.chefSettings.depositType === 'percentage' || req.body.depositType === 'percentage') {
            user.chefSettings.depositValue = Math.min(Math.max(val, 1), 100);
          } else {
            user.chefSettings.depositValue = val;
          }
        }
      }

      // Save the updated user document
      user
        .save()
        .then(async (updatedUser) => {
          
          // Sync locations to ChefBranch if user is a chef
          if (updatedUser.type === 'chef' && locationData) {
            try {
              // SAFEGUARD: Do not delete existing branches if the user manages them via Dashboard.
              // Only auto-create basic branches if the chef has NO branches at all (e.g., initial onboarding).
              const existingBranchesCount = await ChefBranch.countDocuments({ chef: updatedUser._id });
              
              if (existingBranchesCount === 0 && Array.isArray(locationData) && locationData.length > 0) {
                const branchesToCreate = [];
                
                // 2. Create new branches from locations
                for (const loc of locationData) {
                // Parse simple address string
                // Format assumed: "Address, City, Country" or similar
                const parts = loc.description.split(',').map(p => p.trim());
                let city = 'Unknown';
                let country = 'Unknown';
                
                // Heuristic parsing
                if (parts.length >= 2) {
                    country = parts[parts.length - 1];
                    // Try to find city - usually before country or postal code
                    const possibleCity = parts[parts.length - 2];
                    if (!isNaN(possibleCity)) { // It's numeric (postal code)
                       if (parts.length >= 3) {
                           city = parts[parts.length - 3];
                       }
                    } else {
                        city = possibleCity;
                    }
                } else if (parts.length === 1) {
                    city = parts[0];
                }

                branchesToCreate.push({
                  chef: updatedUser._id,
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
                    phoneNumber: updatedUser.phone || 'N/A',
                    countryCode: '+20' // Default or extract
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
                  isPrimary: branchesToCreate.length === 0 // First one is primary
                });
              }
              
              if (branchesToCreate.length > 0) {
                  await ChefBranch.insertMany(branchesToCreate);
                  console.log(`Synced ${branchesToCreate.length} branches for chef ${updatedUser._id}`);
              }
              
              } // End of existingBranchesCount === 0 check
              
            } catch (err) {
              console.error('Error syncing chef branches:', err);
              // Don't fail the user update request, just log error
            }
          }

          res.json({
            user: updatedUser,
            success: true,
          });
        })
        .catch((err) => {
          errors.error = "Error saving user to the database";
          return res.status(500).json({ ...errors, ...err });
        });
    })
    .catch((err) => {
      console.log('err ', err)
      errors.error = "Error checking for the user in the database";
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = updateUser;
