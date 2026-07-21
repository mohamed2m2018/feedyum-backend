const MissionParticipation = require('../../models/missionParticipation');
const Story = require('../../models/story');
const { createAttribution } = require('../../services/commissionService');

const trackAttribution = async (req, res) => {
  try {
    const { referralCode, storyId, source = 'deep_link' } = req.body;
    if (!referralCode || !storyId) {
      return res.status(400).json({ success: false, message: 'referralCode and storyId are required' });
    }
    if (!['deep_link', 'in_app_view', 'share_link', 'qr_code'].includes(source)) {
      return res.status(400).json({ success: false, message: 'Invalid attribution source' });
    }
    const participation = await MissionParticipation.findOne({ referralCode, storyId });
    if (!participation || !['active', 'content_submitted'].includes(participation.status)) {
      return res.status(404).json({ success: false, message: 'Active referral not found' });
    }
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    const attribution = await createAttribution(req.user._id, story, source);
    return res.json({ success: true, data: attribution ? { expiresAt: attribution.expiresAt } : null });
  } catch (error) {
    console.error(JSON.stringify({ event: 'scouting.attribution_failed', message: error.message }));
    return res.status(500).json({ success: false, message: 'Could not track attribution' });
  }
};

module.exports = trackAttribution;
