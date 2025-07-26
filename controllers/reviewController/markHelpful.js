const Review = require('../../models/review');

const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked this review as helpful
    const existingHelpful = review.helpful.find(
      helpful => helpful.userId.toString() === userId
    );

    if (existingHelpful) {
      // Remove helpful mark
      review.helpful = review.helpful.filter(
        helpful => helpful.userId.toString() !== userId
      );
      await review.save();

      return res.json({
        success: true,
        message: 'Helpful mark removed',
        isHelpful: false,
        helpfulCount: review.helpful.length
      });
    } else {
      // Add helpful mark
      review.helpful.push({ userId });
      await review.save();

      return res.json({
        success: true,
        message: 'Review marked as helpful',
        isHelpful: true,
        helpfulCount: review.helpful.length
      });
    }

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

module.exports = markHelpful;
