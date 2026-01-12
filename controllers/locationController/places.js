const axios = require('axios');
const keys = require('../../config/keys');

exports.searchPlaces = async (req, res) => {
    try {
        const { query, location, radius, components } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query string is required' });
        }

        if (!keys.googleMapsApiKey) {
            console.error('Google Maps API Key is missing in config');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Google Places Autocomplete API
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${keys.googleMapsApiKey}`;

        if (location) url += `&location=${encodeURIComponent(location)}`;
        if (radius) url += `&radius=${encodeURIComponent(radius)}`;
        if (components) url += `&components=${encodeURIComponent(components)}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
            const predictions = response.data.predictions.map(prediction => ({
                id: prediction.place_id,
                description: prediction.description,
                place_id: prediction.place_id,
                structured_formatting: prediction.structured_formatting,
            }));
            return res.json(predictions);
        } else {
            console.error('Google Places API Error:', response.data);
            return res.status(400).json({ error: 'Failed to fetch places', details: response.data.status });
        }
    } catch (error) {
        console.error('Places search error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPlaceDetails = async (req, res) => {
    try {
        const { place_id } = req.query;

        if (!place_id) {
            return res.status(400).json({ error: 'Place ID is required' });
        }

        if (!keys.googleMapsApiKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=geometry,formatted_address,address_components&key=${keys.googleMapsApiKey}`;

        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            return res.json(response.data.result);
        } else {
            console.error('Google Place Details API Error:', response.data);
            return res.status(400).json({ error: 'Failed to fetch place details', details: response.data.status });
        }
    } catch (error) {
        console.error('Place details error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
