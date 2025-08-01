const Review = require('../../models/review');
const Order = require('../../models/order');
const Dish = require('../../models/dish');
const User = require('../../models/user');

const addReview = async (req, res) => {
  try {
    const { orderId, chefId, dishId, type, rating, comment, tags, images } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!orderId || !chefId || !type || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, chefId, type, rating'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId).populate('chef user items.dish');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own orders'
      });
    }

    // Check if order is completed
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed orders'
      });
    }

    // For dish reviews, verify dish exists in the order
    if (type === 'dish') {
      if (!dishId) {
        return res.status(400).json({
          success: false,
          message: 'dishId is required for dish reviews'
        });
      }

      const dishInOrder = order.items.find(item => 
        item.dish._id.toString() === dishId
      );

      if (!dishInOrder) {
        return res.status(400).json({
          success: false,
          message: 'Dish not found in this order'
        });
      }
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      userId,
      orderId,
      chefId,
      dishId: type === 'dish' ? dishId : undefined,
      type
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item'
      });
    }

    // Create new review
    const reviewData = {
      userId,
      orderId,
      chefId,
      type,
      rating,
      comment: comment || '',
      tags: tags || [],
      images: images || [],
      isVerified: true
    };

    if (type === 'dish') {
      reviewData.dishId = dishId;
    }

    const newReview = new Review(reviewData);
    await newReview.save();

    // Update dish average rating if it's a dish review
    if (type === 'dish') {
      const dishReviews = await Review.find({ dishId, type: 'dish' });
      const averageRating = dishReviews.reduce((sum, review) => sum + review.rating, 0) / dishReviews.length;
      
      await Dish.findByIdAndUpdate(dishId, {
        average_rating: Math.round(averageRating * 10) / 10
      });
    }

    // Update chef average rating
    const chefReviews = await Review.find({ chefId });
    const chefAverageRating = chefReviews.reduce((sum, review) => sum + review.rating, 0) / chefReviews.length;
    
    await User.findByIdAndUpdate(chefId, {
      averageRating: Math.round(chefAverageRating * 10) / 10,
      totalReviews: chefReviews.length
    });

    // Populate the review for response
    const populatedReview = await Review.findById(newReview._id)
      .populate('userId', 'fullName username avatar')
      .populate('chefId', 'fullName username avatar')
      .populate('dishId', 'name image')
      .populate('orderId', 'created_at status');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

module.exports = addReview;
