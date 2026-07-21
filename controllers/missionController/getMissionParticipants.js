const MissionParticipation = require('../../models/missionParticipation');

const getMissionParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { mission: id };

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [participations, total] = await Promise.all([
      MissionParticipation.find(filter)
        .populate('user', 'fullName username avatar email')
        .populate('storyId', 'uri caption')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MissionParticipation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Participants retrieved successfully',
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
    console.error('Error getting mission participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving participants',
    });
  }
};

module.exports = getMissionParticipants;
