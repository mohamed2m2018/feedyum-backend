const Review = require('../../models/review');

const getReviews = async (req, res) => {
  try {
    const { chefId, dishId, type, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    const query = {};
    if (chefId) query.chefId = chefId;
    if (dishId) query.dishId = dishId;
    if (type) query.type = type;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate('userId', 'fullName username avatar')
      .populate('chefId', 'fullName username avatar')
      .populate('dishId', 'name image price')
      .populate('orderId', 'created_at status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / parseInt(limit));

    // Calculate statistics
    const stats = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    let ratingStats = {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (stats.length > 0) {
      const stat = stats[0];
      ratingStats.averageRating = Math.round(stat.averageRating * 10) / 10;
      ratingStats.totalReviews = stat.totalReviews;
      
      // Calculate distribution
      stat.ratingDistribution.forEach(rating => {
        ratingStats.distribution[rating]++;
      });
    }

    // Format reviews for response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags,
      images: review.images,
      type: review.type,
      isVerified: review.isVerified,
      helpfulCount: review.helpful.length,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.userId,
      chef: review.chefId,
      dish: review.dishId,
      order: review.orderId
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        stats: ratingStats
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

module.exports = getReviews;
