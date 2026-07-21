const MissionParticipation = require('../../models/missionParticipation');

const getMyMissions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [participations, total] = await Promise.all([
      MissionParticipation.find(filter)
        .populate('mission')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MissionParticipation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'My missions retrieved successfully',
      data: {
        participations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting my missions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving my missions',
    });
  }
};

module.exports = getMyMissions;
