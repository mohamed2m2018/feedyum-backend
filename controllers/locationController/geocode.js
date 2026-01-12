const axios = require('axios');
const keys = require('../../config/keys');

exports.reverseGeocode = async (req, res) => {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        if (!keys.googleMapsApiKey) {
            console.error('Google Maps API Key is missing in config');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${keys.googleMapsApiKey}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            const results = response.data.results;
            if (results.length > 0) {
                // Return the first result (most specific address)
                return res.json({
                    address: results[0].formatted_address,
                    placeId: results[0].place_id,
                    components: results[0].address_components
                });
            } else {
                return res.status(404).json({ error: 'No address found' });
            }
        } else {
            console.error('Google Maps API Error:', response.data);
            return res.status(400).json({ error: 'Failed to fetch address', details: response.data.status });
        }
    } catch (error) {
        console.error('Geocoding error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
