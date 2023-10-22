const mongoose = require('mongoose');

// Models
const Story = mongoose.model('story');
const ReportedPost = mongoose.model('ReportedPost');

const reportStory = async (req, res) => {
  // Validate request body
  if (!req.body.storyId) {
    return res.status(400).json({ error: 'Story ID is required' });
  }
  if (!req.body.reportReason) {
    return res.status(400).json({ error: 'Report reason is required' });
  }

  try {
    const { storyId, reportReason } = req.body;

    // Find the story by ID
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Create a reported post
    const reportedPost = new ReportedPost({
      author: story.author,
      uri: story.uri || "no uri",
      caption: story.caption,
      title: story.title,
      price: story.price || 0,
      phone: story.phone,
      linkToGo: story.linkToGo,
      originalId: story._id,
      reportReason,
    });

    await reportedPost.save();

    return res.status(200).json({ message: 'Story reported successfully', reportedPost });
  } catch (error) {
    console.error('Error reporting story:', error);
    return res.status(500).json({ error: 'An error occurred while reporting the story' });
  }
};

module.exports = reportStory;
