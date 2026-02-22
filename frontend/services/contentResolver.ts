import {
  ONBOARDING_SYSTEM_PROMPT,
  VUCA_STATION_SYSTEM_PROMPT,
  ENTREPRENEUR_STATION_SYSTEM_PROMPT,
  SELF_LEARNING_STATION_SYSTEM_PROMPT,
} from './prompts';
import { JOURNEYS, ALL_DIMENSIONS as DEFAULT_ALL_DIMENSIONS } from '../constants/journeys';
import { FIRST_STATIONS } from '../constants/stations';
import type { EditablePrompts, EditableJourney, EditableStation } from '../types/admin';
import type { JourneyDefinition, Station } from '../types/journey';

const PROMPTS_KEY = 'skillr-custom-prompts';
const JOURNEYS_KEY = 'skillr-custom-journeys';
const STATIONS_KEY = 'skillr-custom-stations';

// --- Prompts ---

const DEFAULT_PROMPTS: EditablePrompts = {
  onboarding: ONBOARDING_SYSTEM_PROMPT,
  vucaStation: VUCA_STATION_SYSTEM_PROMPT,
  entrepreneurStation: ENTREPRENEUR_STATION_SYSTEM_PROMPT,
  selfLearningStation: SELF_LEARNING_STATION_SYSTEM_PROMPT,
};

export function getPrompts(): EditablePrompts {
  try {
    const stored = localStorage.getItem(PROMPTS_KEY);
    if (stored) {
      const overrides = JSON.parse(stored) as Partial<EditablePrompts>;
      return { ...DEFAULT_PROMPTS, ...overrides };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PROMPTS };
}

export function savePrompts(prompts: EditablePrompts): void {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

export function resetPrompts(): void {
  localStorage.removeItem(PROMPTS_KEY);
}

export function getDefaultPrompts(): EditablePrompts {
  return { ...DEFAULT_PROMPTS };
}

// --- Journeys ---

function journeyDefToEditable(j: JourneyDefinition): EditableJourney {
  return {
    type: j.type,
    title: j.title,
    subtitle: j.subtitle,
    description: j.description,
    icon: j.icon,
    colorClass: j.colorClass,
    glowClass: j.glowClass,
    gradientClass: j.gradientClass,
    bgClass: j.bgClass,
    dimensions: j.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      experienceLabel: d.experienceLabel,
      description: d.description,
    })),
  };
}

function editableToJourneyDef(e: EditableJourney): JourneyDefinition {
  return {
    type: e.type as JourneyDefinition['type'],
    title: e.title,
    subtitle: e.subtitle,
    description: e.description,
    icon: e.icon,
    colorClass: e.colorClass,
    glowClass: e.glowClass,
    gradientClass: e.gradientClass,
    bgClass: e.bgClass,
    dimensions: e.dimensions,
  };
}

const DEFAULT_JOURNEYS: EditableJourney[] = Object.values(JOURNEYS).map(journeyDefToEditable);

export function getJourneys(): EditableJourney[] {
  try {
    const stored = localStorage.getItem(JOURNEYS_KEY);
    if (stored) return JSON.parse(stored) as EditableJourney[];
  } catch { /* ignore */ }
  return DEFAULT_JOURNEYS.map((j) => ({ ...j, dimensions: [...j.dimensions] }));
}

export function getJourneysAsDefinitions(): Record<string, JourneyDefinition> {
  const journeys = getJourneys();
  const result: Record<string, JourneyDefinition> = {};
  for (const j of journeys) {
    result[j.type] = editableToJourneyDef(j);
  }
  return result;
}

export function getAllDimensions() {
  const journeys = getJourneys();
  return journeys.flatMap((j) => j.dimensions);
}

export function saveJourneys(journeys: EditableJourney[]): void {
  localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys));
}

export function resetJourneys(): void {
  localStorage.removeItem(JOURNEYS_KEY);
}

export function getDefaultJourneys(): EditableJourney[] {
  return DEFAULT_JOURNEYS.map((j) => ({ ...j, dimensions: [...j.dimensions] }));
}

// --- Stations ---

function stationToEditable(s: Station): EditableStation {
  return {
    id: s.id,
    journeyType: s.journeyType,
    title: s.title,
    description: s.description,
    setting: s.setting,
    character: s.character,
    challenge: s.challenge,
    technique: s.technique,
    dimensions: [...s.dimensions],
  };
}

function editableToStation(e: EditableStation): Station {
  return {
    id: e.id,
    journeyType: e.journeyType as Station['journeyType'],
    title: e.title,
    description: e.description,
    setting: e.setting,
    character: e.character,
    challenge: e.challenge,
    technique: e.technique,
    dimensions: [...e.dimensions],
    status: 'available',
  };
}

const DEFAULT_STATIONS: EditableStation[] = Object.values(FIRST_STATIONS).map(stationToEditable);

export function getStations(): EditableStation[] {
  try {
    const stored = localStorage.getItem(STATIONS_KEY);
    if (stored) return JSON.parse(stored) as EditableStation[];
  } catch { /* ignore */ }
  return DEFAULT_STATIONS.map((s) => ({ ...s, dimensions: [...s.dimensions] }));
}

export function getStationsAsRecord(): Record<string, Station> {
  const stations = getStations();
  const result: Record<string, Station> = {};
  for (const s of stations) {
    result[s.journeyType] = editableToStation(s);
  }
  return result;
}

export function saveStations(stations: EditableStation[]): void {
  localStorage.setItem(STATIONS_KEY, JSON.stringify(stations));
}

export function resetStations(): void {
  localStorage.removeItem(STATIONS_KEY);
}

export function getDefaultStations(): EditableStation[] {
  return DEFAULT_STATIONS.map((s) => ({ ...s, dimensions: [...s.dimensions] }));
}

// --- Station Counts ---

export function getStationCountPerJourney(): Record<string, number> {
  const stations = getStations();
  const counts: Record<string, number> = {};
  for (const s of stations) {
    counts[s.journeyType] = (counts[s.journeyType] || 0) + 1;
  }
  return counts;
}

// --- Global ---

export function resetAll(): void {
  resetPrompts();
  resetJourneys();
  resetStations();
}

export function exportAllAsJSON(): string {
  return JSON.stringify({
    prompts: getPrompts(),
    journeys: getJourneys(),
    stations: getStations(),
  }, null, 2);
}

export function importAllFromJSON(json: string): void {
  const data = JSON.parse(json);
  if (data.prompts) savePrompts(data.prompts);
  if (data.journeys) saveJourneys(data.journeys);
  if (data.stations) saveStations(data.stations);
}
