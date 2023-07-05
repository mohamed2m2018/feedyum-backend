const mongoose = require('mongoose');

const View = mongoose.model('view');

const Story = mongoose.model('story');

// Get views by author ID
const getViewsByAuthorId = async (req, res) => {
  const { userId } = req.params;

  try {
    const userStories = await Story.find({ author: userId }, '_id');
    const userStoryIds = userStories.map(story => story._id);

    const viewsCount = await View.countDocuments({ story: { $in: userStoryIds } });

    res.json({ viewsCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch views count' });
  }

};

module.exports = getViewsByAuthorId;

