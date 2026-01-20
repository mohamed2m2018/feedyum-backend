/**
 * Script to recalculate and update dish average_rating from existing reviews
 * 
 * Run this script with: node scripts/recalculateDishRatings.js
 * 
 * This script:
 * 1. Finds all dish reviews in the Review model
 * 2. Groups them by dishId and calculates average rating
 * 3. Updates each dish's average_rating field
 * 4. Also recalculates chef's total reviews/average rating
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ No MongoDB URI found in environment variables');
        console.log('   Set MONGO_URI or MONGODB_URI in your .env file');
        process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
};

const recalculateDishRatings = async () => {
    try {
        await connectDB();

        // Import models after connection
        const Review = require('../models/review');
        const Dish = require('../models/dish');
        const User = require('../models/user');

        console.log('\n🔍 Finding all dish reviews...');

        // Get all dish reviews grouped by dishId
        const dishRatings = await Review.aggregate([
            { $match: { type: 'dish', dishId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$dishId',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        console.log(`📊 Found ${dishRatings.length} dishes with reviews\n`);

        if (dishRatings.length === 0) {
            console.log('⚠️  No dish reviews found in the database');
            console.log('   Make sure reviews have type="dish" and dishId set');

            // Debug: Check what reviews exist
            const allReviews = await Review.find().limit(5).lean();
            console.log('\n🔍 Sample reviews in database:');
            allReviews.forEach(r => {
                console.log(`   - Type: ${r.type}, DishId: ${r.dishId}, Rating: ${r.rating}`);
            });

            await mongoose.disconnect();
            return;
        }

        // Update each dish's average_rating
        let updatedDishes = 0;
        let failedDishes = 0;

        for (const rating of dishRatings) {
            const roundedRating = Math.round(rating.averageRating * 10) / 10;

            const result = await Dish.updateOne(
                { _id: rating._id },
                { $set: { average_rating: roundedRating } }
            );

            if (result.modifiedCount > 0 || result.matchedCount > 0) {
                const dish = await Dish.findById(rating._id).select('name').lean();
                console.log(`✅ Updated "${dish?.name || rating._id}": ${roundedRating} ⭐ (${rating.reviewCount} reviews)`);
                updatedDishes++;
            } else {
                console.log(`⚠️  Dish ${rating._id} not found`);
                failedDishes++;
            }
        }

        console.log(`\n📈 Dish ratings updated: ${updatedDishes} dishes`);
        if (failedDishes > 0) {
            console.log(`⚠️  Failed to update: ${failedDishes} dishes (not found)`);
        }

        // Now recalculate chef ratings based on their dish reviews
        console.log('\n🔄 Recalculating chef ratings...');

        const chefRatings = await Review.aggregate([
            { $match: { chefId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$chefId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        console.log(`📊 Found ${chefRatings.length} chefs with reviews\n`);

        let updatedChefs = 0;

        for (const chefRating of chefRatings) {
            const roundedRating = Math.round(chefRating.averageRating * 10) / 10;

            const result = await User.updateOne(
                { _id: chefRating._id },
                {
                    $set: {
                        averageRating: roundedRating,
                        totalReviews: chefRating.totalReviews
                    }
                }
            );

            if (result.modifiedCount > 0 || result.matchedCount > 0) {
                const chef = await User.findById(chefRating._id).select('fullName').lean();
                console.log(`✅ Updated chef "${chef?.fullName || chefRating._id}": ${roundedRating} ⭐ (${chefRating.totalReviews} reviews)`);
                updatedChefs++;
            }
        }

        console.log(`\n📈 Chef ratings updated: ${updatedChefs} chefs`);

        console.log('\n✨ Rating recalculation complete!');
        console.log('   Refresh your app to see the updated ratings.\n');

        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run the script
recalculateDishRatings();
