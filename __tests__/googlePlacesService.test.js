const { searchRestaurants, TEXT_SEARCH_URL } = require('../services/googlePlacesService');

describe('Google Places legacy integration', () => {
  const originalPlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  const originalMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalPlacesKey === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = originalPlacesKey;
    if (originalMapsKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
    else process.env.GOOGLE_MAPS_API_KEY = originalMapsKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('requires server-side configuration', async () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    await expect(searchRestaurants('pizza')).rejects.toMatchObject({ code: 'PLACES_NOT_CONFIGURED' });
  });

  test('uses legacy text search and maps stable Place IDs', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'OK', results: [{
        place_id: 'legacy-place-id', name: 'Test Restaurant', formatted_address: 'Cairo',
        geometry: { location: { lat: 30.04, lng: 31.23 } }, rating: 4.5,
      }] }),
    });

    const result = await searchRestaurants('test', { mode: 'area', center: { lat: 30, lng: 31 }, radiusMeters: 1000 });

    expect(result[0]).toMatchObject({
      placeId: 'legacy-place-id',
      name: 'Test Restaurant',
      location: { lat: 30.04, lng: 31.23 },
    });
    const requestUrl = new URL(fetch.mock.calls[0][0]);
    expect(`${requestUrl.origin}${requestUrl.pathname}`).toBe(TEXT_SEARCH_URL);
    expect(requestUrl.searchParams.get('key')).toBe('test-key');
    expect(requestUrl.searchParams.get('location')).toBe('30,31');
    expect(requestUrl.searchParams.get('radius')).toBe('1000');
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
  });

  test('returns an empty result for ZERO_RESULTS', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ZERO_RESULTS', results: [] }) });
    await expect(searchRestaurants('not-real')).resolves.toEqual([]);
  });
});
