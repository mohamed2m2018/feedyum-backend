const axios = require('axios');
const keys = require('../../config/keys');
const { reverseGeocodeArea } = require('../../utils/reverseGeocodeArea');

/**
 * Calculate points around a circle perimeter for coverage area detection
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {number} numPoints - Number of points around the circle (default 8)
 * @returns {Array<{lat: number, lng: number, direction: string}>} Array of perimeter points
 */
const calculatePerimeterPoints = (centerLat, centerLng, radiusKm, numPoints = 8) => {
    const points = [];
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const earthRadius = 6371; // km

    for (let i = 0; i < numPoints; i++) {
        // Angle in radians (0 = North, clockwise)
        const angle = (i * 2 * Math.PI) / numPoints;

        // Convert to lat/lng offset using haversine formula
        const lat = centerLat + (radiusKm / earthRadius) * (180 / Math.PI) * Math.cos(angle);
        const lng = centerLng + (radiusKm / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);

        points.push({
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
            direction: directions[i] || `P${i}`
        });
    }

    return points;
};

/**
 * Get coverage areas (neighborhoods) within a delivery radius
 * @route GET /api/branches/coverage-areas
 * @query lat - Center latitude
 * @query long - Center longitude
 * @query radius - Radius in kilometers
 */
const getCoverageAreas = async (req, res) => {
    try {
        const { lat, long, radius } = req.query;

        // Validate inputs
        if (!lat || !long) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }

        const centerLat = parseFloat(lat);
        const centerLng = parseFloat(long);
        const radiusKm = parseFloat(radius) || 20;

        if (isNaN(centerLat) || isNaN(centerLng)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        if (radiusKm < 1 || radiusKm > 100) {
            return res.status(400).json({
                success: false,
                error: 'Radius must be between 1 and 100 km'
            });
        }

        // Check API key
        if (!keys.googleMapsApiKey) {
            console.error('Google Maps API Key is missing');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // Business-optimized: Balance accuracy vs API cost
        // 2 rings (50% and 100%) with 8 points each + center = 17 API calls
        // This provides good coverage without excessive cost
        const ringDistances = [
            radiusKm * 0.5,   // Middle ring - captures inner neighborhoods
            radiusKm * 1.0,   // Outer ring - captures edge neighborhoods
        ];

        // Generate points for each ring with 8 compass directions
        let allPoints = [
            { lat: centerLat, lng: centerLng, direction: 'CENTER' }
        ];

        for (const ringRadius of ringDistances) {
            const ringPoints = calculatePerimeterPoints(centerLat, centerLng, ringRadius, 8);
            allPoints = allPoints.concat(ringPoints);
        }

        // Reverse geocode all points in parallel
        const areaPromises = allPoints.map(point => reverseGeocodeArea(point.lat, point.lng));
        const areaResults = await Promise.all(areaPromises);

        // Deduplicate by placeId (reliable) — keeps first occurrence's name
        const seenPlaceIds = new Set();
        const uniqueAreas = [];
        for (const area of areaResults) {
            if (area && area.placeId && !seenPlaceIds.has(area.placeId)) {
                seenPlaceIds.add(area.placeId);
                uniqueAreas.push({ name: area.name, placeId: area.placeId });
            }
        }

        // Sort alphabetically by name
        uniqueAreas.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        res.json({
            success: true,
            areas: uniqueAreas,
            radius: radiusKm,
            center: {
                lat: centerLat,
                long: centerLng
            },
            pointsChecked: allPoints.length
        });

    } catch (error) {
        console.error('Error getting coverage areas:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coverage areas',
            message: error.message
        });
    }
};

module.exports = getCoverageAreas;
