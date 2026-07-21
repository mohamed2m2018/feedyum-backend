const Mission = require('../../models/mission');

const updateMission = async (req, res) => {
  try {
    const { id } = req.params;

    const mission = await Mission.findById(id);
    if (!mission) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found',
      });
    }

    // Don't allow changing the mission type
    if (req.body.type && req.body.type !== mission.type) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change mission type after creation',
      });
    }

    const allowedFields = [
      'title', 'titleAr', 'description', 'descriptionAr', 'coverImage',
      'status', 'targetChefId', 'targetGooglePlaceId', 'targetRestaurantName',
      'targetRestaurantAddress', 'targetArea', 'rewards', 'maxParticipants',
      'target',
      'startDate', 'endDate', 'attributionWindowDays',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        mission[field] = req.body[field];
      }
    });

    mission.updatedAt = Date.now();
    await mission.save();

    return res.status(200).json({
      success: true,
      message: 'Mission updated successfully',
      data: mission,
    });
  } catch (error) {
    console.error('Error updating mission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating mission',
    });
  }
};

module.exports = updateMission;
