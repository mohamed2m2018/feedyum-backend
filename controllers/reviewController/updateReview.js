const Review = require('../../models/review');

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, tags, images } = req.body;
    const userId = req.user.id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update fields
    const updateData = { updatedAt: new Date() };
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (tags !== undefined) updateData.tags = tags;
    if (images !== undefined) updateData.images = images;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    ).populate('userId', 'fullName username profileImage')
     .populate('chefId', 'fullName username profileImage')
     .populate('dishId', 'name image')
     .populate('orderId', 'created_at status');

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

module.exports = updateReview;
