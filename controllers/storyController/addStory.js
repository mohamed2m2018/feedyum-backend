const mongoose = require("mongoose");
// Validations
const validateStory = require("../../validations/AddStory");


// Models
const Story = mongoose.model("story");
const User = mongoose.model("user");
const Dish = mongoose.model("dish");
const Menu = mongoose.model("menu");

// Services
const embeddingService = require('../../services/embeddingService');
const cacheManager = require('../../utils/cacheManager');

const addStory = async (req, res) => {
  console.log('--- DEBUG: addStory endpoint hit ---');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  // Validate
  const { errors, isValid } = validateStory(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Get the user creating the story
  const user = await User.findById(req.user._id);

  // Check if user is a chef and validate menu requirement (skip for reviews)
  if (user.type === 'chef' && !req.body.reviewMode) {
    // Check if chef has a menu
    const chefMenu = await Menu.findOne({ chef: req.user._id }).populate('dishes');

    if (!chefMenu) {
      errors.error = "Chef users must create a menu before posting. Please add your menu first.";
      return res.status(400).json(errors);
    }

    // Ensure chef's menu has at least one dish before allowing posting
    if (!chefMenu.dishes || chefMenu.dishes.length === 0) {
      errors.error = "Chef users must add at least one dish to their menu before posting.";
      return res.status(400).json(errors);
    }

    // Validate that selected dishes exist in chef's menu
    if (req.body.dishes && req.body.dishes.length > 0) {
      const menuDishIds = chefMenu.dishes.map(dish => dish._id.toString());
      const selectedDishIds = req.body.dishes;

      const invalidDishes = selectedDishIds.filter(dishId => !menuDishIds.includes(dishId));
      if (invalidDishes.length > 0) {
        errors.error = "Selected dishes must be from your menu.";
        return res.status(400).json(errors);
      }
    }
  }

  // Handle dish IDs based on context
  let dishIds = [];

  if (req.body.reviewMode || req.body.isReview) {
    // For reviews (both legacy reviewMode and new isReview flow), use the dish IDs as-is
    // They reference existing dishes being reviewed, not new dishes to create
    dishIds = req.body.dishes || [];
    console.log('Review mode: Using dish IDs directly:', dishIds);
  } else if (user.type === 'chef') {
    // For chef users creating regular posts, use existing dish IDs from their menu
    dishIds = req.body.dishes || [];
    console.log('Chef mode: Using existing dish IDs:', dishIds);
  } else {
    // For non-chef users creating regular posts (not reviews), create new dishes if needed
    if (req.body.dishes && req.body.dishes.length > 0) {
      const savedDishes = await Dish.insertMany(req.body.dishes);
      dishIds = savedDishes.map(dish => dish._id);
      console.log('Regular user mode: Created new dishes:', dishIds);
    }
  }

  // Default food images for poster field
  const defaultFoodImages = [
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop'
  ];

  // Ensure poster field has a proper image URL
  let posterUrl = req.body?.poster;

  // For image posts (isImage: true), use avatarUri as poster if poster not provided
  if (!posterUrl && req.body?.avatarUri && req.body?.isImage) {
    posterUrl = req.body.avatarUri;
  }

  if (!posterUrl || !posterUrl.startsWith('http')) {
    // If still no poster URL, use a random default food image
    posterUrl = defaultFoodImages[Math.floor(Math.random() * defaultFoodImages.length)];
  }

  // Handle categories - for review mode, we might get category names instead of IDs
  let finalCategoryIds = [];

  try {
    if (req.body.category && req.body.category.length > 0) {
      const Category = mongoose.model("category");

      for (const categoryItem of req.body.category) {
        if (mongoose.Types.ObjectId.isValid(categoryItem)) {
          // It's already an ObjectId
          finalCategoryIds.push(categoryItem);
        } else {
          // It's a category name, find or create it
          let categoryDoc = await Category.findOne({ name: categoryItem });

          if (!categoryDoc) {
            categoryDoc = new Category({
              name: categoryItem,
              description: `Category for ${categoryItem}`,
            });
            await categoryDoc.save();
            console.log(`Created new category: ${categoryItem}`);
          }

          finalCategoryIds.push(categoryDoc._id);
        }
      }
    } else {
      // If no categories provided, use default
      const Category = mongoose.model("category");
      let defaultCategory = await Category.findOne({ name: "Food" });
      if (!defaultCategory) {
        defaultCategory = new Category({
          name: "Food",
          description: "Default food category",
        });
        await defaultCategory.save();
      }
      finalCategoryIds = [defaultCategory._id];
    }
  } catch (categoryError) {
    console.error('Category processing error:', categoryError);
    // Fallback to empty array if category processing fails
    finalCategoryIds = [];
  }

  // Create new story
  const newStory = new Story({
    caption: req.body?.caption,
    uri: req.body?.uri,
    author: req.user._id,
    price: req.body?.price,
    avatarUri: req.body?.avatarUri,
    category: finalCategoryIds,
    title: req.body?.title,
    phone: req.body?.phone,
    duration: req.body?.duration,
    governorate: req.body?.governorate,
    areas: req.body?.areas,
    poster: posterUrl,
    linkToGo: req.body?.linkToGo,
    reviewMode: req.body?.reviewMode,
    dishes: dishIds,
    allowContact: req.body?.allowContact,
    // Review-specific fields
    reviewType: req.body?.reviewType,
    reviewedDish: req.body?.reviewedDish,
    reviewedMenu: req.body?.reviewedMenu,
    rating: req.body?.rating,

    // New User Review Flow Fields
    isReview: req.body?.isReview,
    reviewedChef: req.body?.reviewedChefId,
    googlePlaceId: req.body?.googlePlaceId,
    restaurantName: req.body?.restaurantName,
    restaurantAddress: req.body?.restaurantAddress,
    dishName: req.body?.dishName,
  });

  newStory
    .save()
    .then(async (story) => {
      await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: 1 } });

      // Generate embedding for the new story
      try {
        const text = embeddingService.prepareTextForEmbedding(story, [
          'title',
          'caption',
          'description'
        ]);

        if (text && text.trim().length > 0) {
          const embedding = await embeddingService.generateEmbedding(text);
          if (embedding) {
            await Story.findByIdAndUpdate(story._id, {
              embedding: embedding,
              embeddingGenerated: new Date()
            });
            console.log(`✅ Generated embedding for new story: ${story.title || story.caption || story._id}`);
          } else {
            console.log(`⚠️ Failed to generate embedding for story: ${story.title || story.caption || story._id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error generating embedding for story ${story.title || story.caption || story._id}:`, error.message);
        // Don't fail the story creation if embedding generation fails
      }

      // Rating aggregation for reviews (isReview flow)
      if (req.body?.isReview && req.body?.rating && dishIds.length > 0) {
        try {
          const Review = require('../../models/review');
          const reviewedDishId = dishIds[0]; // Use first dish as the reviewed dish

          // Get chef ID from the dish
          const reviewedDish = await Dish.findById(reviewedDishId);
          const chefId = reviewedDish?.user_id;

          // Create Review document for rating aggregation
          const reviewDoc = new Review({
            userId: req.user._id,
            chefId: chefId,
            dishId: reviewedDishId,
            storyId: story._id,
            type: 'dish',
            rating: parseInt(req.body.rating),
            comment: req.body?.caption || '',
            isVerified: true,
          });
          await reviewDoc.save();
          console.log('✅ Review document created for isReview flow:', reviewDoc._id);

          // Update story with reviewedDish field for consistency
          await Story.findByIdAndUpdate(story._id, {
            reviewedDish: reviewedDishId,
            reviewMode: true,
            reviewType: 'dish'
          });

          // Update dish average_rating
          const dishReviews = await Review.find({ dishId: reviewedDishId, type: 'dish' });
          const avgRating = dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
          await Dish.findByIdAndUpdate(reviewedDishId, {
            average_rating: Math.round(avgRating * 10) / 10,
            total_ratings: dishReviews.length
          });
          console.log(`✅ Updated dish ${reviewedDishId} average_rating to ${avgRating.toFixed(1)} (${dishReviews.length} reviews)`);

          // Update chef average rating
          if (chefId) {
            const chefReviews = await Review.find({ chefId: chefId });
            const chefAvgRating = chefReviews.reduce((sum, r) => sum + r.rating, 0) / chefReviews.length;
            await User.findByIdAndUpdate(chefId, {
              averageRating: Math.round(chefAvgRating * 10) / 10,
              averageDishRating: Math.round(avgRating * 10) / 10,
              totalReviews: chefReviews.length
            });
            console.log(`✅ Updated chef ${chefId} averageRating to ${chefAvgRating.toFixed(1)} (${chefReviews.length} reviews)`);
          }
        } catch (reviewError) {
          console.error('❌ Failed to process review aggregation:', reviewError.message);
          // Don't fail the story creation if review aggregation fails
        }
      }

      // Cache invalidation removed - No caching used

      // Notify followers about the new reel (background, non-blocking)
      try {
        const Follow = require('../../models/follow');
        const NotifService = require('../../services/enhancedNotificationService');
        const notifTrans = require('../../services/notificationTranslations');

        const followers = await Follow.find({ following_id: req.user._id })
          .select('follower_id')
          .lean();

        if (followers.length > 0) {
          const followerIds = followers.map(f => f.follower_id.toString());
          const authorName = user.fullName || user.username || '';

          NotifService.sendNotification({
            userIds: followerIds,
            title: notifTrans.newReelTitle,
            message: {
              en: notifTrans.newReelMessage.en(authorName),
              ar: notifTrans.newReelMessage.ar(authorName),
            },
            type: 'reel',
            targetId: story._id.toString(),
            additionalData: {
              action: 'new_reel',
              authorName,
            },
            largeIcon: user.avatar || null,
          }).catch(err => console.error('[addStory] Follower notification failed:', err.message));
        }
      } catch (notifErr) {
        console.error('[addStory] Follower notification error:', notifErr.message);
      }

      return res.json({ story, success: true });
    })
    .catch((err) => {
      console.log("err from newStory.save(): ", err);
      // Give the exact validation error to the frontend
      errors.error = err.message || "Error saving user to database";
      return res.status(500).json({ ...errors, ...err });
    });
};

module.exports = addStory;
