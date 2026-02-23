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

  // Lernreise Content Pack
  { stationId: 'lr-loeten', journeyType: 'entrepreneur', city: 'Nuernberg', lat: 49.45, lng: 11.08 },
  { stationId: 'lr-lachs-angeln', journeyType: 'vuca', city: 'Tromsoe', lat: 69.65, lng: 18.96 },
  { stationId: 'lr-baeume-faellen', journeyType: 'vuca', city: 'Schwarzwald', lat: 48.0, lng: 8.15 },
  { stationId: 'lr-gold-finden', journeyType: 'entrepreneur', city: 'Dawson City', lat: 64.06, lng: -139.43 },
  { stationId: 'lr-boot-bauen', journeyType: 'entrepreneur', city: 'Flensburg', lat: 54.79, lng: 9.44 },
  { stationId: 'lr-kleider-naehen', journeyType: 'self-learning', city: 'Florenz', lat: 43.77, lng: 11.25 },
  { stationId: 'lr-rehkitz-pflegen', journeyType: 'self-learning', city: 'Bayerischer Wald', lat: 48.9, lng: 13.4 },
  { stationId: 'lr-schneemobil-fahren', journeyType: 'vuca', city: 'Rovaniemi', lat: 66.5, lng: 25.73 },
  { stationId: 'lr-einbaum-segeln', journeyType: 'vuca', city: 'Samoa', lat: -13.83, lng: -171.76 },
  { stationId: 'lr-wildpferde-reiten', journeyType: 'self-learning', city: 'Mongolei', lat: 47.92, lng: 106.91 },
];

export function getCoordForStation(stationId: string): StationCoord | undefined {
  return STATION_COORDINATES.find((c) => c.stationId === stationId);
}

export function getCoordsForJourney(journeyType: string): StationCoord[] {
  return STATION_COORDINATES.filter((c) => c.journeyType === journeyType);
}
