const { distanceMeters, validateTarget } = require('../services/missionEligibilityService');

describe('mission eligibility', () => {
  test('calculates geographic distance in meters', () => {
    expect(distanceMeters({ lat: 30.0444, lng: 31.2357 }, { lat: 30.0454, lng: 31.2357 }))
      .toBeGreaterThan(100);
    expect(distanceMeters({ lat: 30.0444, lng: 31.2357 }, { lat: 30.0454, lng: 31.2357 }))
      .toBeLessThan(120);
  });

  test('accepts only the configured exact place', () => {
    const mission = { type: 'scouting', target: { mode: 'exact_place', placeId: 'place-a' } };
    expect(validateTarget(mission, { placeId: 'place-a' })).toEqual({ eligible: true });
    expect(validateTarget(mission, { placeId: 'place-b' })).toEqual({ eligible: false, reason: 'WRONG_PLACE' });
  });

  test('enforces an area radius', () => {
    const mission = {
      type: 'scouting',
      target: { mode: 'area', center: { lat: 30.0444, lng: 31.2357 }, radiusMeters: 500 },
    };
    expect(validateTarget(mission, { placeId: 'near', location: { lat: 30.045, lng: 31.2357 } }).eligible).toBe(true);
    const far = validateTarget(mission, { placeId: 'far', location: { lat: 30.1, lng: 31.3 } });
    expect(far.eligible).toBe(false);
    expect(far.reason).toBe('OUTSIDE_TARGET_AREA');
  });

  test('rejects candidates without a stable Google Place ID', () => {
    const mission = { type: 'scouting', target: { mode: 'exact_place', placeId: 'place-a' } };
    expect(validateTarget(mission, {})).toEqual({ eligible: false, reason: 'PLACE_ID_REQUIRED' });
  });
});
