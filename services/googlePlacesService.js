const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const MAX_RESULTS = 10;

function mapLegacyPlace(place) {
  const placeId = place.place_id;
  const name = place.name || '';
  const address = place.formatted_address || '';
  const mapsQuery = encodeURIComponent(name || address || 'Restaurant');

  return {
    placeId,
    name,
    address,
    rating: place.rating ?? null,
    location: place.geometry?.location
      ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
      : null,
    googleMapsUri: placeId
      ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}&query_place_id=${encodeURIComponent(placeId)}`
      : null,
  };
}

async function searchRestaurants(query, target) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const error = new Error('Google Places is not configured');
    error.code = 'PLACES_NOT_CONFIGURED';
    throw error;
  }

  const params = new URLSearchParams({
    query: `${query} restaurant`,
    type: 'restaurant',
    key: apiKey,
  });
  if (target?.mode === 'area' && target.center && target.radiusMeters) {
    params.set('location', `${target.center.lat},${target.center.lng}`);
    params.set('radius', String(Math.min(target.radiusMeters, 50000)));
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${TEXT_SEARCH_URL}?${params.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        const error = new Error(`Places API returned HTTP ${response.status}`);
        error.retryable = response.status >= 500 || response.status === 429;
        throw error;
      }

      const data = await response.json();
      if (data.status === 'ZERO_RESULTS') return [];
      if (data.status !== 'OK') {
        const error = new Error(`Places API returned ${data.status || 'UNKNOWN_ERROR'}`);
        error.code = data.status || 'PLACES_ERROR';
        error.retryable = ['UNKNOWN_ERROR', 'OVER_QUERY_LIMIT'].includes(data.status);
        throw error;
      }

      return (data.results || [])
        .filter(place => place.place_id)
        .slice(0, MAX_RESULTS)
        .map(mapLegacyPlace);
    } catch (error) {
      lastError = error;
      if (!error.retryable || attempt === 1) break;
    }
  }
  throw lastError;
}

module.exports = { searchRestaurants, mapLegacyPlace, TEXT_SEARCH_URL, MAX_RESULTS };
