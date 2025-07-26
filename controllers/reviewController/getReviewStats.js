const Review = require('../../models/review');

const getReviewStats = async (req, res) => {
  try {
    const { chefId, dishId } = req.query;

    if (!chefId && !dishId) {
      return res.status(400).json({
        success: false,
        message: 'Either chefId or dishId is required'
      });
    }

    // Build query
    const query = {};
    if (chefId) query.chefId = chefId;
    if (dishId) query.dishId = dishId;

    // Get comprehensive statistics
    const stats = await Review.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratings: { $push: '$rating' },
          tags: { $push: '$tags' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReviews: 0,
          averageRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          topTags: [],
          recentReviews: []
        }
      });
    }

    const stat = stats[0];
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stat.ratings.forEach(rating => {
      distribution[rating]++;
    });

    // Calculate percentages
    const percentages = {};
    Object.keys(distribution).forEach(rating => {
      percentages[rating] = Math.round((distribution[rating] / stat.totalReviews) * 100);
    });

    // Calculate top tags
    const tagCounts = {};
    stat.tags.flat().forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / stat.totalReviews) * 100)
      }));

    // Get recent reviews
    const recentReviews = await Review.find(query)
      .populate('userId', 'fullName username profileImage')
      .populate('dishId', 'name image')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rating comment tags createdAt');

    res.json({
      success: true,
      data: {
        totalReviews: stat.totalReviews,
        averageRating: Math.round(stat.averageRating * 10) / 10,
        distribution,
        percentages,
        topTags,
        recentReviews
      }
    });

  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

module.exports = getReviewStats;
