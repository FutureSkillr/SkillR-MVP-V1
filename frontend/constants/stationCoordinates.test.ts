import { describe, it, expect } from 'vitest';
import {
  STATION_COORDINATES,
  getCoordForStation,
  getCoordsForJourney,
} from './stationCoordinates';

describe('stationCoordinates', () => {
  it('has coordinates for all default stations', () => {
    expect(STATION_COORDINATES.length).toBeGreaterThanOrEqual(3);
  });

  it('getCoordForStation returns coord for known station', () => {
    const coord = getCoordForStation('vuca-01');
    expect(coord).toBeDefined();
    expect(coord!.city).toBe('Rom');
    expect(coord!.lat).toBeCloseTo(41.9, 0);
  });

  it('getCoordForStation returns undefined for unknown station', () => {
    expect(getCoordForStation('nonexistent')).toBeUndefined();
  });

  it('getCoordsForJourney returns coords for vuca journey', () => {
    const coords = getCoordsForJourney('vuca');
    expect(coords.length).toBeGreaterThanOrEqual(1);
    expect(coords[0].journeyType).toBe('vuca');
  });

  it('getCoordsForJourney returns empty for nonexistent journey', () => {
    expect(getCoordsForJourney('nonexistent')).toEqual([]);
  });

  it('all coordinates have valid lat/lng', () => {
    for (const coord of STATION_COORDINATES) {
      expect(coord.lat).toBeGreaterThanOrEqual(-90);
      expect(coord.lat).toBeLessThanOrEqual(90);
      expect(coord.lng).toBeGreaterThanOrEqual(-180);
      expect(coord.lng).toBeLessThanOrEqual(180);
    }
  });
});
