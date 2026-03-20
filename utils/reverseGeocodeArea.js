const axios = require('axios');
const keys = require('../config/keys');

/**
 * Reverse geocode a single point to get area/neighborhood name and Google place_id.
 *
 * Google Geocoding API returns multiple `results`, each with its own `place_id`
 * and `types`. We search through results to find the most granular area-level
 * result (sublocality → neighborhood → locality → admin_area_level_2).
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{name: string, placeId: string}|null>} Area info or null
 */
const reverseGeocodeArea = async (lat, lng) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${keys.googleMapsApiKey}&language=ar,en`;

        const response = await axios.get(url, { timeout: 5000 });

        if (response.data.status !== 'OK' || !response.data.results?.length) {
            return null;
        }

        const results = response.data.results;

        // Priority: find a result whose types include our target area types.
        // Each result has its own place_id — this is the correct way to get it.
        const areaTypePriority = [
            'sublocality_level_1',
            'sublocality',
            'neighborhood',
            'locality',
            'administrative_area_level_2',
        ];

        for (const targetType of areaTypePriority) {
            const match = results.find(r => r.types && r.types.includes(targetType));
            if (match && match.place_id) {
                const areaComponent = match.address_components?.[0];
                const name = areaComponent?.long_name || match.formatted_address?.split(',')[0] || '';
                const location = match.geometry?.location || { lat, lng };
                return { name, placeId: match.place_id, lat: location.lat, lng: location.lng };
            }
        }

        // Ultimate fallback: use the first result
        const first = results[0];
        if (first?.place_id) {
            const name = first.address_components?.[0]?.long_name || first.formatted_address?.split(',')[0] || '';
            const location = first.geometry?.location || { lat, lng };
            return { name, placeId: first.place_id, lat: location.lat, lng: location.lng };
        }

        return null;
    } catch (error) {
        console.error(`[reverseGeocodeArea] Error for (${lat}, ${lng}):`, error.message);
        return null;
    }
};

module.exports = { reverseGeocodeArea };

