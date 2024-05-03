const Rating = require('../../models/rating'); // Adjust the path as necessary

const addRating = async (req, res) => {
  const { userId, postId, rating } = req.body;

  try {
    let existingRating = await Rating.findOne({ userId, postId });

    if (existingRating) {
      // Update the existing rating
      existingRating.rating = rating;
      await existingRating.save();
      res.json({ message: 'Rating updated successfully', rating: existingRating });
    } else {
      // Create a new rating
      const newRating = new Rating({ userId, postId, rating });
      await newRating.save();
      res.status(201).json({ message: 'Rating added successfully', rating: newRating });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing rating', error: error.message });
  }
};

module.exports = addRating;
