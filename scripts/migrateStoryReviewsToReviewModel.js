/**
 * Migration Script: Convert Story Reviews to Review Model
 * 
 * Run with: node scripts/migrateStoryReviewsToReviewModel.js
 * 
 * This script:
 * 1. Finds all Stories with rating > 0 (review reels)
 * 2. Creates Review documents from Story data
 * 3. Updates dish average_rating for each reviewed dish
 * 4. Updates chef averageRating/totalReviews for each chef
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ No MongoDB URI found');
        process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
};

const migrateReviews = async () => {
    try {
        await connectDB();

        // Import models
        const Story = require('../models/story');
        const Review = require('../models/review');
        const Dish = require('../models/dish');
        const User = require('../models/user');

        // Find all review stories
        console.log('🔍 Finding Story reviews with rating > 0...');
        const reviewStories = await Story.find({
            rating: { $exists: true, $gt: 0 }
        }).populate('reviewedDish', 'user_id').lean();

        console.log(`📊 Found ${reviewStories.length} review stories to migrate\n`);

        if (reviewStories.length === 0) {
            console.log('⚠️  No review stories found. Nothing to migrate.');
            await mongoose.disconnect();
            return;
        }

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const story of reviewStories) {
            try {
                // Check if Review already exists for this story
                const existingReview = await Review.findOne({ storyId: story._id });
                if (existingReview) {
                    console.log(`⏭️  Review already exists for Story ${story._id}`);
                    skipped++;
                    continue;
                }

                // Determine chefId from reviewedDish or from dish's user_id
                let chefId = null;
                if (story.reviewedDish && story.reviewedDish.user_id) {
                    chefId = story.reviewedDish.user_id;
                } else if (story.reviewedChef) {
                    chefId = story.reviewedChef;
                } else if (story.reviewedDish) {
                    // Fetch dish to get user_id
                    const dish = await Dish.findById(story.reviewedDish).select('user_id').lean();
                    chefId = dish?.user_id;
                }

                if (!chefId) {
                    console.log(`⚠️  Skipping Story ${story._id} - no chef found`);
                    skipped++;
                    continue;
                }

                // Create Review document
                const reviewDoc = new Review({
                    userId: story.author,
                    chefId: chefId,
                    dishId: story.reviewedDish?._id || story.reviewedDish,
                    storyId: story._id,
                    type: story.reviewType === 'dish' ? 'dish' : 'chef',
                    rating: story.rating,
                    comment: story.caption || '',
                    isVerified: true,
                    createdAt: story.created_at,
                });

                await reviewDoc.save();
                console.log(`✅ Created Review for Story ${story._id} (${story.rating}⭐)`);
                created++;

            } catch (err) {
                console.error(`❌ Error migrating Story ${story._id}:`, err.message);
                errors++;
            }
        }

        console.log(`\n📈 Migration Results:`);
        console.log(`   ✅ Created: ${created}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);

        // Now recalculate all dish ratings
        console.log('\n🔄 Recalculating dish ratings...');

        const dishRatings = await Review.aggregate([
            { $match: { type: 'dish', dishId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$dishId',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        for (const dr of dishRatings) {
            await Dish.findByIdAndUpdate(dr._id, {
                average_rating: Math.round(dr.avgRating * 10) / 10
            });
            const dish = await Dish.findById(dr._id).select('name').lean();
            console.log(`   ✅ ${dish?.name || dr._id}: ${dr.avgRating.toFixed(1)}⭐ (${dr.count} reviews)`);
        }

        // Recalculate chef ratings
        console.log('\n🔄 Recalculating chef ratings...');

        const chefRatings = await Review.aggregate([
            { $match: { chefId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$chefId',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        for (const cr of chefRatings) {
            await User.findByIdAndUpdate(cr._id, {
                averageRating: Math.round(cr.avgRating * 10) / 10,
                totalReviews: cr.count
            });
            const chef = await User.findById(cr._id).select('fullName').lean();
            console.log(`   ✅ ${chef?.fullName || cr._id}: ${cr.avgRating.toFixed(1)}⭐ (${cr.count} reviews)`);
        }

        console.log('\n✨ Migration complete!');
        console.log('   Refresh your app to see updated ratings.\n');

        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');

    } catch (error) {
        console.error('\n❌ Migration error:', error);
        process.exit(1);
    }
};

migrateReviews();
