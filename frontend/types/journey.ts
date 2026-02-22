export type JourneyType = 'vuca' | 'entrepreneur' | 'self-learning';

export type StationStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface Station {
  id: string;
  journeyType: JourneyType;
  title: string;
  description: string;
  setting: string;
  character?: string;
  challenge?: string;
  technique?: string;
  dimensions: string[];
  status: StationStatus;
}

export interface StationResult {
  stationId: string;
  journeyType: JourneyType;
  dimensionScores: Record<string, number>;
  summary: string;
  completedAt: number;
}

export interface JourneyDefinition {
  type: JourneyType;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  colorClass: string;
  glowClass: string;
  gradientClass: string;
  bgClass: string;
  dimensions: JourneyDimension[];
}

export interface JourneyDimension {
  key: string;
  label: string;
  experienceLabel: string;
  description: string;
}
