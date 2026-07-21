const MissionParticipation = require('../../models/missionParticipation');

const getMissionLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = {
      mission: id,
      status: { $in: ['active', 'completed'] },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [participations, total] = await Promise.all([
      MissionParticipation.find(filter)
        .populate('user', 'fullName username avatar')
        .sort({ 'metrics.totalOrdersGenerated': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MissionParticipation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: {
        leaderboard: participations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting mission leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving leaderboard',
    });
  }
};

module.exports = getMissionLeaderboard;
