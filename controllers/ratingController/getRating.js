const Rating = require('../../models/rating'); // Adjust the path as necessary

const getRatings = async (req, res) => {
  const { postId } = req.params; // Assuming the post ID is passed as a URL parameter

  try {
    const ratings = await Rating.find({ postId }); // Include user details like 'username'
    const averageRating = ratings.length > 0 ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length : 0;

    res.json({ averageRating: averageRating.toFixed(2) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ratings', error: error.message });
  }
};

module.exports =  getRatings
