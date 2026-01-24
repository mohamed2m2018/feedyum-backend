const mongoose = require("mongoose");
const ChefBranch = mongoose.model("chefBranch");

/**
 * Default maximum delivery distance in kilometers (fallback if branch doesn't have deliveryRadius set)
 */
const DEFAULT_DELIVERY_DISTANCE_KM = 20;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Extract coordinates from various address formats
 * Handles: location.lat/long, coordinates.lat/lng, direct lat/long
 * @param {Object} address - Address object with coordinates in various formats
 * @returns {{ lat: number|null, long: number|null }} Extracted coordinates
 */
const extractCoordinates = (address) => {
    if (!address) return { lat: null, long: null };

    let lat = null, long = null;

    if (address.location?.lat && address.location?.long) {
        lat = parseFloat(address.location.lat);
        long = parseFloat(address.location.long);
    } else if (address.coordinates?.lat && address.coordinates?.lng) {
        lat = parseFloat(address.coordinates.lat);
        long = parseFloat(address.coordinates.lng);
    } else if (address.lat && address.long) {
        lat = parseFloat(address.lat);
        long = parseFloat(address.long);
    }

    // Validate parsed values
    if (isNaN(lat) || isNaN(long)) {
        return { lat: null, long: null };
    }

    return { lat, long };
};

/**
 * Find the nearest active branch for a chef
 * @param {string} chefId - Chef's MongoDB ObjectId
 * @param {number} userLat - User's latitude
 * @param {number} userLong - User's longitude
 * @returns {Promise<{ nearestBranch: Object|null, nearestDistance: number, allBranches: Array }>}
 */
const findNearestBranch = async (chefId, userLat, userLong) => {
    const chefBranches = await ChefBranch.find({ chef: chefId, isActive: true });

    if (chefBranches.length === 0) {
        return { nearestBranch: null, nearestDistance: Infinity, allBranches: [] };
    }

    let nearestBranch = null;
    let nearestDistance = Infinity;
    const branchesWithDistance = [];

    for (const branch of chefBranches) {
        if (branch.location?.lat && branch.location?.long) {
            const distance = calculateDistance(
                userLat, userLong,
                parseFloat(branch.location.lat),
                parseFloat(branch.location.long)
            );

            // Get branch's delivery radius or use default fallback
            const branchDeliveryRadius = branch.deliveryRadius || DEFAULT_DELIVERY_DISTANCE_KM;

            branchesWithDistance.push({
                branchId: branch._id,
                branchName: branch.branchName,
                address: branch.addressDetails?.formattedAddress,
                deliveryFee: branch.deliveryFee,
                minimumOrder: branch.minimumOrderAmount,
                deliveryRadius: branchDeliveryRadius,
                distance: Math.round(distance * 10) / 10
            });

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestBranch = branch;
            }
        }
    }

    return { nearestBranch, nearestDistance, allBranches: branchesWithDistance };
};

/**
 * Validate if delivery is possible based on distance
 * Uses the branch's specific deliveryRadius (or default fallback)
 * @param {string} chefId - Chef's MongoDB ObjectId
 * @param {Object} deliveryAddress - Delivery address with coordinates
 * @returns {Promise<{ canDeliver: boolean, nearestBranch: Object|null, nearestDistance: number, error: string|null, allBranches: Array }>}
 */
const validateDeliveryDistance = async (chefId, deliveryAddress) => {
    const { lat: userLat, long: userLong } = extractCoordinates(deliveryAddress);

    // Check if coordinates are present
    if (!userLat || !userLong) {
        return {
            canDeliver: false,
            nearestBranch: null,
            nearestDistance: Infinity,
            error: 'missing_coordinates',
            errorMessage: 'Delivery address must include location coordinates',
            allBranches: []
        };
    }

    const { nearestBranch, nearestDistance, allBranches } = await findNearestBranch(chefId, userLat, userLong);

    // Check if chef has any active branches
    if (!nearestBranch) {
        return {
            canDeliver: false,
            nearestBranch: null,
            nearestDistance: Infinity,
            error: 'no_active_branches',
            errorMessage: 'This kitchen has no active delivery locations',
            allBranches: []
        };
    }

    // Get the branch's delivery radius (or use default fallback)
    const branchDeliveryRadius = nearestBranch.deliveryRadius || DEFAULT_DELIVERY_DISTANCE_KM;

    // Check if within the branch's delivery radius
    const canDeliver = nearestDistance <= branchDeliveryRadius;

    if (!canDeliver) {
        return {
            canDeliver: false,
            nearestBranch: {
                branchId: nearestBranch._id,
                branchName: nearestBranch.branchName,
                deliveryRadius: branchDeliveryRadius
            },
            nearestDistance: Math.round(nearestDistance * 10) / 10,
            error: 'delivery_distance_exceeded',
            errorMessage: 'This kitchen is too far from your location',
            maxDistance: branchDeliveryRadius,
            allBranches
        };
    }

    return {
        canDeliver: true,
        nearestBranch: {
            branchId: nearestBranch._id,
            branchName: nearestBranch.branchName,
            deliveryFee: nearestBranch.deliveryFee,
            deliveryRadius: branchDeliveryRadius
        },
        nearestDistance: Math.round(nearestDistance * 10) / 10,
        error: null,
        errorMessage: null,
        maxDistance: branchDeliveryRadius,
        allBranches: allBranches.filter(b => b.distance <= b.deliveryRadius)
    };
};

module.exports = {
    DEFAULT_DELIVERY_DISTANCE_KM,
    calculateDistance,
    extractCoordinates,
    findNearestBranch,
    validateDeliveryDistance
};
