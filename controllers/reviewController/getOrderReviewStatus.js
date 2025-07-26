const Review = require('../../models/review');
const Order = require('../../models/order');

const getOrderReviewStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId).populate('items.dish chef');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order is completed
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order not yet completed',
        canReview: false
      });
    }

    // Get existing reviews for this order
    const existingReviews = await Review.find({
      userId,
      orderId
    });

    // Check chef review status
    const chefReview = existingReviews.find(review => review.type === 'chef');
    const hasChefReview = !!chefReview;

    // Check dish review status
    const dishReviews = existingReviews.filter(review => review.type === 'dish');
    const dishReviewStatus = order.items.map(item => {
      const dishReview = dishReviews.find(review => 
        review.dishId && review.dishId.toString() === item.dish._id.toString()
      );
      
      return {
        dishId: item.dish._id,
        dishName: item.dish.name,
        dishImage: item.dish.image,
        hasReview: !!dishReview,
        review: dishReview || null
      };
    });

    const totalDishes = order.items.length;
    const reviewedDishes = dishReviews.length;
    const allDishesReviewed = reviewedDishes === totalDishes;

    // Calculate completion percentage
    const totalReviewsNeeded = totalDishes + 1; // dishes + chef
    const completedReviews = reviewedDishes + (hasChefReview ? 1 : 0);
    const completionPercentage = Math.round((completedReviews / totalReviewsNeeded) * 100);

    res.json({
      success: true,
      data: {
        orderId,
        canReview: true,
        orderStatus: order.status,
        completionPercentage,
        chef: {
          id: order.chef._id,
          name: order.chef.fullName || order.chef.username,
          image: order.chef.profileImage,
          hasReview: hasChefReview,
          review: chefReview || null
        },
        dishes: dishReviewStatus,
        summary: {
          totalDishes,
          reviewedDishes,
          hasChefReview,
          allDishesReviewed,
          allReviewsCompleted: hasChefReview && allDishesReviewed
        }
      }
    });

  } catch (error) {
    console.error('Get order review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review status',
      error: error.message
    });
  }
};

module.exports = getOrderReviewStatus;
