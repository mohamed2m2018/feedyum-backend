const axios = require('axios');
const keys = require('../../config/keys');

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
 * Reverse geocode a single point to get area/neighborhood name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} Area name or null
 */
const reverseGeocodePoint = async (lat, lng) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${keys.googleMapsApiKey}&language=ar,en`;

        const response = await axios.get(url, { timeout: 5000 });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];

            // Extract area/neighborhood name
            for (const component of result.address_components) {
                const types = component.types;

                // Priority: sublocality_level_1 > sublocality > neighborhood > locality
                if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                    return component.long_name;
                }
                if (types.includes('neighborhood')) {
                    return component.long_name;
                }
            }

            // Fallback to locality (city district)
            for (const component of result.address_components) {
                if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                    return component.long_name;
                }
            }
        }

        return null;
    } catch (error) {
        console.error(`Geocode error for point (${lat}, ${lng}):`, error.message);
        return null;
    }
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
        const areaPromises = allPoints.map(point => reverseGeocodePoint(point.lat, point.lng));
        const areaResults = await Promise.all(areaPromises);

        // Extract unique, non-null area names
        const uniqueAreas = [...new Set(areaResults.filter(area => area !== null))];

        // Sort alphabetically
        uniqueAreas.sort((a, b) => a.localeCompare(b, 'ar'));

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
