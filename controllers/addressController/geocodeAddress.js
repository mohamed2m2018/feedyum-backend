const axios = require('axios');

const geocodeAddress = async (req, res) => {
  const errors = {};

  try {
    const { lat, long } = req.body;

    // Validation
    if (!lat || !long) {
      errors.error = "Latitude and longitude are required";
      return res.status(400).json({ ...errors });
    }

    // Validate coordinates format
    const latitude = parseFloat(lat);
    const longitude = parseFloat(long);

    if (isNaN(latitude) || isNaN(longitude)) {
      errors.error = "Invalid latitude or longitude format";
      return res.status(400).json({ ...errors });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      errors.error = "Latitude must be between -90 and 90, longitude between -180 and 180";
      return res.status(400).json({ ...errors });
    }

    // Use Google Maps Geocoding API for reverse geocoding
    const keys = require('../../config/keys');
    const googleApiKey = keys.googleMapsApiKey;

    if (!googleApiKey) {
      // Fallback response when API key is not available
      const fallbackAddress = `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      return res.json({
        formattedAddress: fallbackAddress,
        addressComponents: {
          street: '',
          area: '',
          city: '',
          country: '',
          postalCode: ''
        },
        success: true,
        source: 'fallback'
      });
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}&language=en`;

    const response = await axios.get(geocodeUrl, {
      timeout: 10000 // 10 second timeout
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressComponents = {};

      // Parse address components
      result.address_components.forEach(component => {
        const types = component.types;

        if (types.includes('street_number')) {
          addressComponents.streetNumber = component.long_name;
        } else if (types.includes('route')) {
          addressComponents.street = component.long_name;
        } else if (types.includes('sublocality') || types.includes('neighborhood')) {
          addressComponents.area = component.long_name;
        } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          addressComponents.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        } else if (types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });

      res.json({
        formattedAddress: result.formatted_address,
        addressComponents: {
          street: `${addressComponents.streetNumber || ''} ${addressComponents.street || ''}`.trim(),
          area: addressComponents.area || '',
          city: addressComponents.city || '',
          state: addressComponents.state || '',
          country: addressComponents.country || '',
          postalCode: addressComponents.postalCode || ''
        },
        success: true,
        source: 'google_maps'
      });
    } else {
      // Fallback when geocoding fails
      const fallbackAddress = `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      res.json({
        formattedAddress: fallbackAddress,
        addressComponents: {
          street: '',
          area: '',
          city: '',
          country: '',
          postalCode: ''
        },
        success: true,
        source: 'fallback'
      });
    }

  } catch (err) {
    console.error('Geocoding error:', err);

    // Provide fallback response on error
    const { lat, long } = req.body;
    const fallbackAddress = lat && long ? `Location at ${parseFloat(lat).toFixed(6)}, ${parseFloat(long).toFixed(6)}` : 'Unknown Location';

    res.json({
      formattedAddress: fallbackAddress,
      addressComponents: {
        street: '',
        area: '',
        city: '',
        country: '',
        postalCode: ''
      },
      success: true,
      source: 'fallback',
      warning: 'Geocoding service unavailable, using fallback'
    });
  }
};

module.exports = geocodeAddress;