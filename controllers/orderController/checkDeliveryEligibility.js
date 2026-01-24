const { findNearestBranch, DEFAULT_DELIVERY_DISTANCE_KM } = require('../../utils/deliveryValidation');

/**
 * Check if a kitchen delivers to a given location
 * @route GET /api/orders/check-delivery/:chefId
 * @query lat - User latitude
 * @query long - User longitude
 */
const checkDeliveryEligibility = async (req, res) => {
    try {
        const { chefId } = req.params;
        const { lat, long } = req.query;

        // Validate required parameters
        if (!chefId) {
            return res.status(400).json({
                success: false,
                error: 'missing_chef_id',
                message: 'Chef ID is required',
            });
        }

        const userLat = parseFloat(lat);
        const userLong = parseFloat(long);

        if (isNaN(userLat) || isNaN(userLong)) {
            return res.status(400).json({
                success: false,
                error: 'missing_coordinates',
                message: 'Valid lat and long query parameters are required',
            });
        }

        // Find nearest branch and calculate distance
        const { nearestBranch, nearestDistance, allBranches } = await findNearestBranch(
            chefId,
            userLat,
            userLong
        );

        // No active branches
        if (!nearestBranch) {
            return res.json({
                success: true,
                canDeliver: false,
                error: 'no_active_branches',
                nearestDistance: null,
                maxDistance: null,
                branchCount: 0,
            });
        }

        // Get branch's delivery radius
        const maxDistance = nearestBranch.deliveryRadius || DEFAULT_DELIVERY_DISTANCE_KM;
        const canDeliver = nearestDistance <= maxDistance;

        return res.json({
            success: true,
            canDeliver,
            nearestDistance: Math.round(nearestDistance * 10) / 10,
            maxDistance,
            nearestBranchName: nearestBranch.branchName || null,
            branchCount: allBranches.length,
        });

    } catch (error) {
        console.error('Check delivery eligibility error:', error);
        return res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'Failed to check delivery eligibility',
        });
    }
};

module.exports = checkDeliveryEligibility;
