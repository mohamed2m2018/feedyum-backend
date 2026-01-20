const mongoose = require("mongoose");
const multer = require("multer");

const keys = require("../../config/keys");

// Validations
const validateCreateReviewReel = require("../../validations/CreateReviewReel");

// Models
const Story = mongoose.model("story");
const User = mongoose.model("user");
const Dish = mongoose.model("dish");
const Menu = mongoose.model("menu");
const Category = mongoose.model("category");
const Review = require("../../models/review");

// Utils

const { r2Client, R2_BUCKET, getPublicUrl } = require("../../utils/r2Client");


// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

const createReviewReel = async (req, res) => {
  console.log("=== CREATE REVIEW REEL REQUEST ===");
  console.log("Request received at:", new Date().toISOString());
  console.log("User ID:", req.user?._id);
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  console.log("Has file:", !!req.file);

  try {
    // Handle file upload
    upload.single("video")(req, res, async (err) => {
      if (err) {
        console.error("File upload error:", err.message);
        return res.status(400).json({ error: err.message });
      }

      try {
        const { caption, rating, reviewType, dishId, menuId } = req.body;

        console.log("Create review reel request:", {
          caption: caption ? caption.substring(0, 50) + "..." : "No caption",
          rating,
          reviewType,
          dishId,
          menuId,
          hasVideo: !!req.file,
          userId: req.user?._id
        });

        // Validate input data
        const { errors, isValid } = validateCreateReviewReel(req.body);
        if (!isValid) {
          console.log("Validation errors:", JSON.stringify(errors, null, 2));
          return res.status(400).json(errors);
        }

        // Get user
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        let reviewedItem = null;
        let categoryIds = [];
        let chefId = null;

        // Validate and get the reviewed item
        if (reviewType === "dish") {
          // Validate ObjectId format
          if (!mongoose.Types.ObjectId.isValid(dishId)) {
            return res.status(400).json({ error: "Invalid dish ID format" });
          }

          reviewedItem = await Dish.findById(dishId).populate("menu");
          if (!reviewedItem) {
            return res.status(404).json({ error: "Dish not found" });
          }
          if (!reviewedItem.visible) {
            return res
              .status(400)
              .json({ error: "This dish is not available for review" });
          }
          chefId = reviewedItem.user_id;

          // Find category ObjectId by name
          if (reviewedItem.category) {
            let categoryDoc = await Category.findOne({ name: reviewedItem.category });

            // If category doesn't exist, create it
            if (!categoryDoc) {
              categoryDoc = new Category({
                name: reviewedItem.category,
                description: `Category for ${reviewedItem.category}`,
              });
              await categoryDoc.save();
              console.log(`Created new category: ${reviewedItem.category}`);
            }

            categoryIds = [categoryDoc._id];
            console.log(`Using category: ${categoryDoc.name} (${categoryDoc._id})`);
          } else {
            // Fallback to a default category
            let defaultCategory = await Category.findOne({ name: "Food" });
            if (!defaultCategory) {
              defaultCategory = new Category({
                name: "Food",
                description: "Default food category",
              });
              await defaultCategory.save();
            }
            categoryIds = [defaultCategory._id];
          }
        } else if (reviewType === "menu") {
          // Validate ObjectId format
          if (!mongoose.Types.ObjectId.isValid(menuId)) {
            return res.status(400).json({ error: "Invalid menu ID format" });
          }

          reviewedItem = await Menu.findById(menuId).populate("chef");
          if (!reviewedItem) {
            return res.status(404).json({ error: "Menu not found" });
          }
          chefId = reviewedItem.chef._id;

          // For menu reviews, use a default category
          let defaultCategory = await Category.findOne({ name: "Food" });
          if (!defaultCategory) {
            defaultCategory = new Category({
              name: "Food",
              description: "Default food category",
            });
            await defaultCategory.save();
          }
          categoryIds = [defaultCategory._id];
          console.log(`Using default category for menu: ${defaultCategory.name} (${defaultCategory._id})`);
        }

        // Prevent users from reviewing their own content
        if (chefId && chefId.toString() === req.user._id.toString()) {
          return res
            .status(400)
            .json({ error: "You cannot review your own content" });
        }

        // Ensure categoryIds is not empty (required field)
        if (!categoryIds || categoryIds.length === 0) {
          console.error("No categories found, creating default category");
          let defaultCategory = await Category.findOne({ name: "Food" });
          if (!defaultCategory) {
            defaultCategory = new Category({
              name: "Food",
              description: "Default food category",
            });
            await defaultCategory.save();
          }
          categoryIds = [defaultCategory._id];
        }

        let videoUrl = null;
        let posterUrl = null;

        // Check if URLs are provided from frontend (already uploaded)
        if (req.body.uri) {
          videoUrl = req.body.uri;
          console.log("Using frontend-provided video URL:", videoUrl);
        }

        if (req.body.poster) {
          posterUrl = req.body.poster;
          console.log("Using frontend-provided poster URL:", posterUrl);
        } else if (req.body.avatarUri) {
          // If no poster but avatarUri exists, it's likely an image post
          posterUrl = req.body.avatarUri;
          console.log("Using frontend-provided avatar URL as poster:", posterUrl);
        }

        // Upload video to Cloudflare R2 if provided (legacy support for direct file uploads)
        if (req.file) {
          const videoKey = `review-reels/${Date.now()}-${req.file.originalname}`;

          const uploadParams = {
            Bucket: R2_BUCKET,
            Key: videoKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };

          console.log("Uploading review video to R2:", {
            bucket: R2_BUCKET,
            key: videoKey,
            contentType: req.file.mimetype,
            size: req.file.size,
          });

          try {
            await r2Client.putObject(uploadParams).promise();
            videoUrl = getPublicUrl(videoKey);

            console.log("R2 upload successful:", {
              url: videoUrl,
              key: videoKey,
            });

            // Generate poster/thumbnail URL (you might want to implement video thumbnail generation)
            posterUrl = reviewedItem.image || videoUrl; // Use dish image or video as poster
          } catch (uploadError) {
            console.error("R2 upload error:", uploadError);
            return res.status(500).json({
              error: "Failed to upload video",
              details: uploadError.message,
            });
          }
        }

        // Set poster URL fallback if no video was uploaded and no poster provided from frontend
        if (!posterUrl && reviewedItem) {
          posterUrl = reviewedItem.image || null;
          console.log("Using dish image as fallback poster:", posterUrl);
        }

        // Create review reel story
        console.log("Creating review reel with data:", {
          caption: caption,
          uri: req.body.uri || videoUrl,
          avatarUri: req.body.avatarUri,
          poster: posterUrl,
          author: req.user._id,
          categoryIds: categoryIds,
          categoryCount: categoryIds ? categoryIds.length : 0,
          reviewType: reviewType,
          dishId: dishId,
          menuId: menuId,
          rating: parseInt(rating),
          reviewedItem: reviewedItem ? reviewedItem.name : 'none'
        });

        const reviewReel = new Story({
          caption: caption,
          uri: req.body.uri || videoUrl,  // Prioritize frontend URL over multer upload
          avatarUri: req.body.avatarUri,  // For images
          author: req.user._id,
          category: categoryIds,
          title: `Review: ${reviewedItem.name}`,
          poster: posterUrl,
          reviewMode: true,
          reviewType: reviewType,
          reviewedDish: reviewType === "dish" ? dishId : undefined,
          reviewedMenu: reviewType === "menu" ? menuId : undefined,
          rating: parseInt(rating),
          dishes: reviewType === "dish" ? [dishId] : [],
          allowContact: true,
          views: 0,
          likes: 0,
          likesNo: 0,
          commentsNo: 0,
        });

        // Save the review reel
        try {
          const savedReviewReel = await reviewReel.save();

          // Update user's posts count
          await User.findByIdAndUpdate(req.user._id, { $inc: { postsNo: 1 } });

          // Populate the response with referenced data
          const populatedReviewReel = await Story.findById(savedReviewReel._id)
            .populate("author", "fullName avatar")
            .populate("reviewedDish", "name image price")
            .populate("reviewedMenu", "name description");

          console.log("Review reel created successfully:", {
            id: savedReviewReel._id,
            author: req.user._id,
            reviewType: reviewType,
            rating: rating,
          });

          // Create Review document for rating aggregation
          try {
            const reviewDoc = new Review({
              userId: req.user._id,
              chefId: chefId,
              dishId: reviewType === "dish" ? dishId : undefined,
              storyId: savedReviewReel._id,
              type: reviewType === "dish" ? "dish" : "chef",
              rating: parseInt(rating),
              comment: caption || "",
              isVerified: true,
            });
            await reviewDoc.save();
            console.log("Review document created:", reviewDoc._id);

            // Update dish average_rating if it's a dish review
            if (reviewType === "dish" && dishId) {
              const dishReviews = await Review.find({ dishId: dishId, type: "dish" });
              const avgRating = dishReviews.reduce((sum, r) => sum + r.rating, 0) / dishReviews.length;
              await Dish.findByIdAndUpdate(dishId, {
                average_rating: Math.round(avgRating * 10) / 10
              });
              console.log(`Updated dish ${dishId} average_rating to ${avgRating.toFixed(1)}`);
            }

            // Update chef average rating
            if (chefId) {
              const chefReviews = await Review.find({ chefId: chefId });
              const chefAvgRating = chefReviews.reduce((sum, r) => sum + r.rating, 0) / chefReviews.length;
              await User.findByIdAndUpdate(chefId, {
                averageRating: Math.round(chefAvgRating * 10) / 10,
                totalReviews: chefReviews.length
              });
              console.log(`Updated chef ${chefId} averageRating to ${chefAvgRating.toFixed(1)} (${chefReviews.length} reviews)`);
            }
          } catch (reviewError) {
            console.error("Failed to create Review document:", reviewError.message);
            // Don't fail the request - the Story was saved successfully
          }

          res.json({
            success: true,
            story: populatedReviewReel,
            message: "Review reel created successfully",
          });

          // Cache removed
        } catch (saveError) {
          console.error("Review reel save error:", saveError);

          // Handle specific validation errors
          if (saveError.name === 'ValidationError') {
            const validationErrors = {};
            for (const field in saveError.errors) {
              validationErrors[field] = saveError.errors[field].message;
            }

            console.error("Validation errors:", validationErrors);
            return res.status(400).json({
              error: "Validation failed",
              details: validationErrors,
              message: "Story validation failed. Check required fields."
            });
          }

          // Handle duplicate key errors
          if (saveError.code === 11000) {
            return res.status(409).json({
              error: "Duplicate entry",
              details: saveError.message,
              message: "This review already exists."
            });
          }

          // Generic database error
          return res.status(500).json({
            error: "Database save failed",
            details: saveError.message,
            message: "Failed to save review to database"
          });
        }
      } catch (innerError) {
        console.error("Create review reel inner error:", innerError);
        res.status(500).json({
          error: "Internal server error",
          details: innerError.message,
        });
      }
    });
  } catch (error) {
    console.error("Create review reel error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

module.exports = createReviewReel;
