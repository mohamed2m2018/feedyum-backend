const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");
const User = mongoose.model("user");

const deleteBranch = async (req, res) => {
  const errors = {};

  try {
    const { branchId } = req.body;

    if (!branchId) {
      errors.branchId = "Branch ID is required";
      return res.status(400).json({ errors, success: false });
    }

    // Find the branch
    const branch = await ChefBranch.findById(branchId);
    if (!branch) {
      errors.branch = "Branch not found";
      return res.status(404).json({ errors, success: false });
    }

    // Check if user owns this branch
    if (branch.chef.toString() !== req.user._id.toString()) {
      errors.authorization = "You can only delete your own branches";
      return res.status(403).json({ errors, success: false });
    }

    // Get chef and other branches
    const chef = await User.findById(req.user._id);
    const otherActiveBranches = await ChefBranch.find({
      chef: req.user._id,
      _id: { $ne: branchId },
      isActive: true
    });

    // Prevent deleting the last branch - at least one branch must exist
    if (otherActiveBranches.length === 0) {
      errors.lastBranch = "Cannot delete your last branch. At least one branch must exist.";
      return res.status(400).json({
        errors,
        success: false,
        message: "Cannot delete your last branch. At least one branch must exist."
      });
    }

    // If this is the primary branch and there are other active branches, promote one
    if (branch.isPrimary && otherActiveBranches.length > 0) {
      const newPrimary = otherActiveBranches[0];
      newPrimary.isPrimary = true;
      await newPrimary.save();
    }

    // Update branch count
    chef.chefSettings = chef.chefSettings || {};
    chef.chefSettings.totalBranches = otherActiveBranches.length;

    // Delete the branch
    await ChefBranch.findByIdAndDelete(branchId);

    // Save chef updates
    await chef.save();

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      remainingBranches: otherActiveBranches.length
    });

  } catch (err) {
    console.error('Error deleting branch:', err);
    errors.database = "Error deleting branch";
    return res.status(500).json({ errors, success: false, details: err.message });
  }
};

module.exports = deleteBranch; 