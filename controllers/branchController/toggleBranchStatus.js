const mongoose = require("mongoose");
const ChefBranch = mongoose.model("chefBranch");

/**
 * Toggle branch open/close status via manual override.
 * @route PUT /api/branches/toggle-status
 * @body { branchId, manualOverride } or { allBranches: true, manualOverride }
 */
const toggleBranchStatus = async (req, res) => {
  const errors = {};

  try {
    const { branchId, allBranches, manualOverride } = req.body;

    // Validate manualOverride value
    const validValues = ['auto', 'forceOpen', 'forceClosed'];
    if (!validValues.includes(manualOverride)) {
      errors.manualOverride = `manualOverride must be one of: ${validValues.join(', ')}`;
      return res.status(400).json({ errors, success: false });
    }

    // Toggle all branches for this chef
    if (allBranches) {
      const result = await ChefBranch.updateMany(
        { chef: req.user._id, isActive: true },
        { $set: { manualOverride, updated_at: new Date() } }
      );

      return res.json({
        success: true,
        modifiedCount: result.modifiedCount,
        manualOverride,
        message: `All branches set to ${manualOverride}`,
      });
    }

    // Toggle single branch
    if (!branchId) {
      errors.branchId = "branchId is required (or set allBranches: true)";
      return res.status(400).json({ errors, success: false });
    }

    const branch = await ChefBranch.findById(branchId);
    if (!branch) {
      errors.branch = "Branch not found";
      return res.status(404).json({ errors, success: false });
    }

    // Check ownership
    if (branch.chef.toString() !== req.user._id.toString()) {
      errors.authorization = "You can only toggle your own branches";
      return res.status(403).json({ errors, success: false });
    }

    branch.manualOverride = manualOverride;
    await branch.save();

    res.json({
      success: true,
      branch: {
        _id: branch._id,
        branchName: branch.branchName,
        manualOverride: branch.manualOverride,
      },
      message: `Branch set to ${manualOverride}`,
    });
  } catch (err) {
    console.error('Error toggling branch status:', err);
    errors.database = "Error toggling branch status";
    return res.status(500).json({ errors, success: false, details: err.message });
  }
};

module.exports = toggleBranchStatus;
