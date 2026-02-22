/** Geographic coordinates for station markers on the globe. */
export interface StationCoord {
  stationId: string;
  journeyType: string;
  city: string;
  lat: number;
  lng: number;
}

export const STATION_COORDINATES: StationCoord[] = [
  // VUCA Journey
  { stationId: 'vuca-01', journeyType: 'vuca', city: 'Rom', lat: 41.9, lng: 12.5 },

  // Entrepreneur Journey
  { stationId: 'entrepreneur-01', journeyType: 'entrepreneur', city: 'Berlin', lat: 52.52, lng: 13.405 },

  // Self-Learning Journey
  { stationId: 'self-learning-01', journeyType: 'self-learning', city: 'New York', lat: 40.71, lng: -74.006 },
];

export function getCoordForStation(stationId: string): StationCoord | undefined {
  return STATION_COORDINATES.find((c) => c.stationId === stationId);
}

export function getCoordsForJourney(journeyType: string): StationCoord[] {
  return STATION_COORDINATES.filter((c) => c.journeyType === journeyType);
}
