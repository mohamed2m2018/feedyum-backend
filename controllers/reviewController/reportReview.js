const Review = require('../../models/review');

const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reported.find(
      report => report.userId.toString() === userId
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }

    // Add report
    review.reported.push({ userId, reason });
    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully',
      reportCount: review.reported.length
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
};

module.exports = reportReview;
