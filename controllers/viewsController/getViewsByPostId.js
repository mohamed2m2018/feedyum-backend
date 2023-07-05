// controllers/viewsController.js
const mongoose = require('mongoose');
const View = mongoose.model('view');

// Get views by story ID
const getViewsByStoryId = async (req, res) => {
    const { storyId } = req.params;
  
    try {
      const viewsCount = await View.countDocuments({ story: storyId });
      res.json({ viewsCount });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch views count' });
    }
};

module.exports = getViewsByStoryId;


