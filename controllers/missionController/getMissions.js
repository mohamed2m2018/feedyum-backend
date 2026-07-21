const Mission = require('../../models/mission');
const { SCOUTING_ENABLED } = require('../../config/missionConfig');

const getMissions = async (req, res) => {
  try {
    const { type, area, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (type) {
      filter.type = type;
    }
    if (!SCOUTING_ENABLED) {
      if (type === 'scouting') return res.json({ success: true, data: { missions: [], pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 }, features: { scoutingEnabled: false } } });
      filter.type = { $ne: 'scouting' };
    }

    if (area) {
      filter.targetArea = area;
    }

    // Default to active missions only
    filter.status = status || 'active';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [missions, total] = await Promise.all([
      Mission.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Mission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Missions retrieved successfully',
      data: {
        missions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        features: { scoutingEnabled: SCOUTING_ENABLED },
      },
    });
  } catch (error) {
    console.error('Error getting missions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving missions',
    });
  }
};

module.exports = getMissions;
