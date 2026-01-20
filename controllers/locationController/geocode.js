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
                const result = results[0];

                // Parse address components for structured data
                const addressComponents = {
                    area: '',
                    city: '',
                    state: '',
                    country: '',
                    postalCode: '',
                    street: ''
                };

                for (const component of result.address_components) {
                    const types = component.types;

                    if (types.includes('sublocality') || types.includes('neighborhood')) {
                        addressComponents.area = component.long_name;
                    } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                        addressComponents.city = component.long_name;
                    } else if (types.includes('administrative_area_level_1')) {
                        addressComponents.state = component.long_name;
                    } else if (types.includes('country')) {
                        addressComponents.country = component.long_name;
                    } else if (types.includes('postal_code')) {
                        addressComponents.postalCode = component.long_name;
                    } else if (types.includes('route')) {
                        addressComponents.street = component.long_name;
                    }
                }

                // Fallback: if no area found, use city as area
                if (!addressComponents.area && addressComponents.city) {
                    addressComponents.area = addressComponents.city;
                }

                return res.json({
                    address: result.formatted_address,
                    placeId: result.place_id,
                    components: result.address_components,
                    addressComponents: addressComponents
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

