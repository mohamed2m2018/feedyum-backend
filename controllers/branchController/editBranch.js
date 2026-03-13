const mongoose = require("mongoose");

// Models
const ChefBranch = mongoose.model("chefBranch");
const User = mongoose.model("user");

const editBranch = async (req, res) => {
  const errors = {};

  try {
    const { branchId } = req.body;
    console.log('🐞 [editBranch] Request body keys:', Object.keys(req.body));
    console.log('🐞 [editBranch] deliveryTiers:', JSON.stringify(req.body.deliveryTiers));
    console.log('🐞 [editBranch] deliveryFee:', req.body.deliveryFee);
    console.log('🐞 [editBranch] deliveryRadius:', req.body.deliveryRadius);

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
      errors.authorization = "You can only edit your own branches";
      return res.status(403).json({ errors, success: false });
    }

    // Get chef to check country restrictions
    const chef = await User.findById(req.user._id);

    // If country is being changed, validate it
    if (req.body.country && req.body.country !== branch.addressDetails.country) {
      if (!chef.canAddBranchInCountry(req.body.country)) {
        errors.country = "Cannot change branch to different country. All branches must be in the same country.";
        return res.status(400).json({ errors, success: false });
      }
    }

    // Update fields if provided
    if (req.body.branchName) {
      branch.branchName = req.body.branchName;
    }

    // Update address details
    if (req.body.streetName) branch.addressDetails.streetName = req.body.streetName;
    if (req.body.buildingNumber) branch.addressDetails.buildingNumber = req.body.buildingNumber;
    if (req.body.area) branch.addressDetails.area = req.body.area;
    if (req.body.city) branch.addressDetails.city = req.body.city;
    if (req.body.state) branch.addressDetails.state = req.body.state;
    if (req.body.country) branch.addressDetails.country = req.body.country;
    if (req.body.postalCode) branch.addressDetails.postalCode = req.body.postalCode;

    // Update formatted address if any address field changed
    if (req.body.streetName || req.body.buildingNumber || req.body.area ||
      req.body.city || req.body.state || req.body.country || req.body.postalCode) {
      branch.addressDetails.formattedAddress =
        `${branch.addressDetails.buildingNumber} ${branch.addressDetails.streetName}, ${branch.addressDetails.area}, ${branch.addressDetails.city}, ${branch.addressDetails.state} ${branch.addressDetails.postalCode}, ${branch.addressDetails.country}`;
    }

    // Update location
    if (req.body.lat) branch.location.lat = parseFloat(req.body.lat);
    if (req.body.long) branch.location.long = parseFloat(req.body.long);

    // Update contact info
    if (req.body.phoneNumber) branch.contactInfo.phoneNumber = req.body.phoneNumber;
    if (req.body.countryCode) branch.contactInfo.countryCode = req.body.countryCode;

    // Update operational details
    if (req.body.deliveryRadius !== undefined) branch.deliveryRadius = req.body.deliveryRadius;
    if (req.body.deliveryFee !== undefined) branch.deliveryFee = req.body.deliveryFee;
    if (req.body.deliveryTiers !== undefined) {
      branch.deliveryTiers = req.body.deliveryTiers;
      branch.markModified('deliveryTiers');
    }
    if (req.body.minimumOrderAmount !== undefined) branch.minimumOrderAmount = req.body.minimumOrderAmount;
    if (req.body.operatingHours) branch.operatingHours = req.body.operatingHours;
    if (req.body.timezone) branch.timezone = req.body.timezone;
    if (req.body.manualOverride !== undefined) branch.manualOverride = req.body.manualOverride;

    // Handle active status change
    if (req.body.isActive !== undefined) {
      const newStatus = req.body.isActive;

      // If deactivating primary branch, ensure there's another branch to promote
      if (!newStatus && branch.isPrimary) {
        const otherActiveBranches = await ChefBranch.find({
          chef: req.user._id,
          _id: { $ne: branchId },
          isActive: true
        });

        if (otherActiveBranches.length === 0) {
          errors.status = "Cannot deactivate primary branch when it's the only active branch";
          return res.status(400).json({ errors, success: false });
        }

        // Promote another branch to primary
        const newPrimary = otherActiveBranches[0];
        newPrimary.isPrimary = true;
        await newPrimary.save();

        branch.isPrimary = false;
      }

      branch.isActive = newStatus;
    }

    // Save the updated branch
    console.log('🐞 [editBranch] Before save - branch.deliveryTiers:', JSON.stringify(branch.deliveryTiers));
    console.log('🐞 [editBranch] Before save - branch.isModified("deliveryTiers"):', branch.isModified('deliveryTiers'));
    const updatedBranch = await branch.save();
    console.log('🐞 [editBranch] After save - updatedBranch.deliveryTiers:', JSON.stringify(updatedBranch.deliveryTiers));

    // Update chef's branch count
    const activeBranchCount = await ChefBranch.countDocuments({
      chef: req.user._id,
      isActive: true
    });

    chef.chefSettings = chef.chefSettings || {};
    chef.chefSettings.totalBranches = activeBranchCount;
    chef.chefSettings.hasBranches = activeBranchCount > 0;
    await chef.save();

    // Populate chef data for response
    await updatedBranch.populate('chef', 'fullName avatar type chefSettings');

    res.json({
      branch: updatedBranch,
      success: true,
      message: 'Branch updated successfully'
    });

  } catch (err) {
    console.error('Error updating branch:', err);
    errors.database = "Error updating branch";
    return res.status(500).json({ errors, success: false, details: err.message });
  }
};

module.exports = editBranch; 