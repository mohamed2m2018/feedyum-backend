const mongoose = require('mongoose');

const Story = mongoose.model('story');
const View = mongoose.model('view');


const getViewsByUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find all stories by the user
    const stories = await Story.find({ author: userId }).select('_id');


    // Get the total views for the user's stories
    const totalViews = await View.aggregate([
      { $match: { story: { $in: stories.map((story) => story._id) } } },
      { $group: { _id: null, totalViews: { $sum: '$count' } } },
    ]);

    // Return the total views
    res.json({ totalViews: totalViews.length ? totalViews[0].totalViews : 0 });
  } catch (error) {
    console.error('Error retrieving user views:', error);
    res.status(500).json({ error: 'Failed to get user views' });
  }
};

module.exports = getViewsByUser;