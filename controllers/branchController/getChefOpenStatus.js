const { isChefOpen } = require('../../utils/branchAvailability');

/**
 * Get open/closed status for a chef's branches.
 * @route GET /api/branches/status/:chefId
 * @access Public
 */
const getChefOpenStatus = async (req, res) => {
  try {
    const { chefId } = req.params;

    if (!chefId) {
      return res.status(400).json({ message: 'chefId is required', success: false });
    }

    const status = await isChefOpen(chefId);

    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    console.error('Error getting chef open status:', err);
    res.status(500).json({ message: 'Error getting status', success: false, details: err.message });
  }
};

module.exports = getChefOpenStatus;
