const Mission = require('../../models/mission');

const createMission = async (req, res) => {
  try {
    const {
      title,
      titleAr,
      description,
      descriptionAr,
      coverImage,
      type,
      status,
      targetChefId,
      targetGooglePlaceId,
      targetRestaurantName,
      targetRestaurantAddress,
      targetArea,
      target,
      rewards,
      maxParticipants,
      startDate,
      endDate,
      attributionWindowDays,
    } = req.body;

    if (!title || !description || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, type, startDate, and endDate are required',
      });
    }

    if (!['scouting', 'reviewing'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be scouting or reviewing',
      });
    }

    if (type === 'scouting' && !target && !targetGooglePlaceId) {
      return res.status(400).json({
        success: false,
        message: 'Scouting missions require an exact-place or area target',
      });
    }

    const mission = new Mission({
      title,
      titleAr,
      description,
      descriptionAr,
      coverImage,
      type,
      status: status || 'draft',
      targetChefId,
      targetGooglePlaceId,
      targetRestaurantName,
      targetRestaurantAddress,
      targetArea,
      target,
      rewards,
      maxParticipants,
      startDate,
      endDate,
      attributionWindowDays,
      createdBy: req.user._id,
    });

    await mission.save();

    return res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      data: mission,
    });
  } catch (error) {
    console.error('Error creating mission:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating mission',
    });
  }
};

module.exports = createMission;
