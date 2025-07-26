const Review = require('../../models/review');
const User = require('../../models/user');

const getDishReviews = async (req, res) => {
  try {
    const dishId = req.params.dishId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get reviews with user information
    const reviews = await Review.find({ dish: dishId })
      .populate('user', 'fullName avatar')
      .populate('order', 'orderNumber createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ dish: dishId });
    const totalPages = Math.ceil(totalReviews / limit);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { dish: dishId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      { $match: { dish: dishId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = avgRatingResult.length > 0 ? avgRatingResult[0].averageRating : 0;

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        _id: review.user._id,
        fullName: review.user.fullName,
        avatar: review.user.avatar,
      },
      order: review.order ? {
        orderNumber: review.order.orderNumber,
        orderDate: review.order.createdAt,
      } : null,
      helpfulCount: review.helpfulCount || 0,
      isHelpful: false, // TODO: Check if current user marked as helpful
    }));

    res.status(200).json({
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      statistics: {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching dish reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = getDishReviews;