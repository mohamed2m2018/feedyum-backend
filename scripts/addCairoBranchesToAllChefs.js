const mongoose = require("mongoose");
const User = require("../models/user");
const ChefBranch = require("../models/chefBranch");
const keys = require("../config/keys");

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(keys.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

const addCairoBranchesToAllChefs = async () => {
  try {
    console.log("🚀 Adding Cairo delivery branches to all chefs...");

    // Find all chef users
    const chefs = await User.find({ type: "chef" });
    console.log(`📊 Found ${chefs.length} chefs in database`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const chef of chefs) {
      console.log(`\n👨‍🍳 Processing chef: ${chef.fullName} (${chef._id})`);

      // Check if chef already has a Cairo branch
      const existingCairoBranch = await ChefBranch.findOne({
        chef: chef._id,
        "addressDetails.city": /cairo/i,
      });

      if (existingCairoBranch) {
        console.log(
          `   ✅ Chef already has Cairo branch: ${existingCairoBranch.branchName}`
        );

        // Update to ensure it's active and has good delivery radius
        await ChefBranch.findByIdAndUpdate(existingCairoBranch._id, {
          isActive: true,
          deliveryRadius: 25, // 25km delivery radius
          operatingHours: [
            {
              day: "monday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "tuesday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "wednesday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "thursday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "friday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "saturday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "sunday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
          ],
          updated_at: new Date(),
        });
        updatedCount++;
      } else {
        console.log(`   🏗️  Creating new Cairo branch for ${chef.fullName}`);

        // Create a new Cairo branch for this chef
        const newBranch = new ChefBranch({
          chef: chef._id,
          branchName: `${chef.fullName}'s Cairo Kitchen`,
          addressDetails: {
            streetName: "Tahrir Square Street",
            buildingNumber: "123",
            area: "Downtown Cairo",
            city: "Cairo",
            state: "Cairo Governorate",
            country: "Egypt",
            postalCode: "11511",
            formattedAddress:
              "123 Tahrir Square Street, Downtown Cairo, Cairo, Cairo Governorate, Egypt",
          },
          location: {
            lat: 30.0444,
            long: 31.2357,
          },
          contactInfo: {
            phoneNumber: chef.phone || "100 000 0000",
            countryCode: "+20",
          },
          operatingHours: [
            {
              day: "monday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "tuesday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "wednesday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "thursday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "friday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "saturday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
            {
              day: "sunday",
              isOpen: true,
              openTime: "09:00",
              closeTime: "22:00",
            },
          ],
          deliveryRadius: 25, // 25km delivery radius
          isActive: true,
          isPrimary: false,
          created_at: new Date(),
          updated_at: new Date(),
        });

        await newBranch.save();
        console.log(`   ✅ Created Cairo branch: ${newBranch.branchName}`);
        createdCount++;
      }
    }

    console.log("\n🎉 Cairo branch setup completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total chefs processed: ${chefs.length}`);
    console.log(`   - Existing branches updated: ${updatedCount}`);
    console.log(`   - New branches created: ${createdCount}`);
    console.log(`   - All chefs now deliver to Cairo! 🚚`);
  } catch (error) {
    console.error("❌ Error adding Cairo branches:", error);
  } finally {
    mongoose.connection.close();
  }
};

async function main() {
  await connectDB();
  await addCairoBranchesToAllChefs();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addCairoBranchesToAllChefs };
