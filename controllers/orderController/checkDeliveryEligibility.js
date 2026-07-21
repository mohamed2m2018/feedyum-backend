const { findNearestBranch, DEFAULT_DELIVERY_DISTANCE_KM } = require('../../utils/deliveryValidation');
const { calculateDeliveryFee, calculateServiceFee } = require('../../config/feeConfig');
const { reverseGeocodeArea } = require('../../utils/reverseGeocodeArea');
const User = require('../../models/user');

/**
 * Check if a kitchen delivers to a given location and return calculated delivery fee
 * @route GET /api/orders/check-delivery/:chefId
 * @query lat - User latitude
 * @query long - User longitude
 */
const checkDeliveryEligibility = async (req, res) => {
    try {
        const { chefId } = req.params;
        const { lat, long, subtotal } = req.query;
        let destinationPlaceName = req.query.placeName || req.query.deliveryAreaName || req.query.areaName;

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
                deliveryFee: 0,
            });
        }

        // Get branch's delivery radius
        const maxDistance = nearestBranch.deliveryRadius || DEFAULT_DELIVERY_DISTANCE_KM;
        const canDeliver = nearestDistance <= maxDistance;

        // Calculate delivery fee from branch area fees or distance tiers
        let destinationPlaceId = req.query.placeId || req.query.deliveryAreaPlaceId;

        if (!destinationPlaceId && nearestBranch?.areaDeliveryFees?.length > 0) {
            try {
                const areaInfo = await reverseGeocodeArea(userLat, userLong);
                if (areaInfo?.placeId) {
                    destinationPlaceId = areaInfo.placeId;
                }
                if (areaInfo?.name) {
                    destinationPlaceName = destinationPlaceName || areaInfo.name;
                }
            } catch (error) {
                console.warn('checkDeliveryEligibility reverse-geocode fallback failed:', error.message);
            }
        }

        const destinationName = typeof destinationPlaceName === 'string' ? destinationPlaceName.trim() : '';

        const deliveryFee = canDeliver
            ? calculateDeliveryFee(
                nearestDistance,
                nearestBranch.deliveryTiers,
                nearestBranch.deliveryFee,
                nearestBranch.areaDeliveryFees,
                destinationPlaceId,
                destinationName
            )
            : 0;

        // Check branch order mode
        const allowScheduledOrders = nearestBranch?.allowScheduledOrders || false;
        const orderMode = nearestBranch?.orderMode || (allowScheduledOrders ? 'both' : 'asap');

        return res.json({
            success: true,
            canDeliver,
            nearestDistance: Math.round(nearestDistance * 10) / 10,
            maxDistance,
            nearestBranchName: nearestBranch.branchName || null,
            branchCount: allBranches.length,
            deliveryFee,
            serviceFee: subtotal ? calculateServiceFee(parseFloat(subtotal)) : null,
            allowScheduledOrders,
            orderMode,
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
