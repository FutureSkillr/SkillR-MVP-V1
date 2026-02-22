export type AdminTab = 'users' | 'roles' | 'meta-kurs' | 'analytics';

export interface EditablePrompts {
  onboarding: string;
  vucaStation: string;
  entrepreneurStation: string;
  selfLearningStation: string;
}

export interface EditableJourney {
  type: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  colorClass: string;
  glowClass: string;
  gradientClass: string;
  bgClass: string;
  dimensions: EditableDimension[];
}

export interface EditableDimension {
  key: string;
  label: string;
  experienceLabel: string;
  description: string;
}

export interface EditableStation {
  id: string;
  journeyType: string;
  title: string;
  description: string;
  setting: string;
  character?: string;
  challenge?: string;
  technique?: string;
  dimensions: string[];
}
