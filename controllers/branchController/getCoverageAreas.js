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

        // Progressive Density Algorithm: Prevents "Swiss Cheese" blind spots at large radiuses
        // The larger the ring, the MORE points it needs. We dynamically generate rings and points.
        let allPoints = [{ lat: centerLat, lng: centerLng, direction: 'CENTER', distance: 0 }];

        if (radiusKm <= 5) {
            const ringPoints = calculatePerimeterPoints(centerLat, centerLng, radiusKm, 8);
            ringPoints.forEach(p => p.distance = radiusKm);
            allPoints = allPoints.concat(ringPoints);
        } else if (radiusKm <= 12) {
            [0.5, 1.0].forEach(multiplier => {
                const ringPoints = calculatePerimeterPoints(centerLat, centerLng, radiusKm * multiplier, 8);
                ringPoints.forEach(p => p.distance = radiusKm * multiplier);
                allPoints = allPoints.concat(ringPoints);
            });
        } else if (radiusKm <= 25) {
            // Progressive density for medium radiuses (3 rings: 8, 12, 16 points)
            const ringSpecs = [{m: 0.33, p: 8}, {m: 0.66, p: 12}, {m: 1.0, p: 16}];
            ringSpecs.forEach(spec => {
                const ringPoints = calculatePerimeterPoints(centerLat, centerLng, radiusKm * spec.m, spec.p);
                ringPoints.forEach(p => p.distance = radiusKm * spec.m);
                allPoints = allPoints.concat(ringPoints);
            });
        } else {
            // Ultimate density for massive radiuses (5 rings: 8, 12, 16, 20, 24 = 81 total API requests)
            const ringSpecs = [
                {m: 0.2, p: 8}, 
                {m: 0.4, p: 12}, 
                {m: 0.6, p: 16}, 
                {m: 0.8, p: 20}, 
                {m: 1.0, p: 24}
            ];
            ringSpecs.forEach(spec => {
                const ringPoints = calculatePerimeterPoints(centerLat, centerLng, radiusKm * spec.m, spec.p);
                ringPoints.forEach(p => p.distance = radiusKm * spec.m);
                allPoints = allPoints.concat(ringPoints);
            });
        }

        // Batch Reverse Geocoding to strictly avoid Google API Rate Limits (50 QPS max)
        const areaResults = [];
        const batchSize = 10;
        
        for (let i = 0; i < allPoints.length; i += batchSize) {
            const batch = allPoints.slice(i, i + batchSize);
            const batchPromises = batch.map(point => reverseGeocodeArea(point.lat, point.lng));
            const batchResults = await Promise.all(batchPromises);
            areaResults.push(...batchResults);
        }

        // Deduplicate by placeId (reliable) — keeps first occurrence's name
        // Keep track of the minimum distance observed for each area
        const seenPlaceIds = new Map();
        for (let i = 0; i < areaResults.length; i++) {
            const area = areaResults[i];
            const dist = allPoints[i].distance;
            
            if (area && area.placeId) {
                if (!seenPlaceIds.has(area.placeId)) {
                    seenPlaceIds.set(area.placeId, { 
                        name: area.name, 
                        placeId: area.placeId,
                        lat: area.lat,
                        lng: area.lng,
                        approxDistance: dist
                    });
                } else {
                    const existing = seenPlaceIds.get(area.placeId);
                    if (dist < existing.approxDistance) {
                        existing.approxDistance = dist;
                    }
                }
            }
        }
        
        const uniqueAreas = Array.from(seenPlaceIds.values());

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
