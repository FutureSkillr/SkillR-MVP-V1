import type { JourneyDefinition } from '../types/journey';

export const JOURNEYS: Record<string, JourneyDefinition> = {
  vuca: {
    type: 'vuca',
    title: 'Reise nach VUCA',
    subtitle: 'Weltreise der Veraenderung',
    description: 'Tauche ein in lebendige Orte und erlebe, wie du mit Veraenderung, Unsicherheit und neuen Situationen umgehst.',
    icon: '🌍',
    colorClass: 'text-blue-400',
    glowClass: 'glow-blue',
    gradientClass: 'gradient-blue',
    bgClass: 'bg-blue-500/10',
    dimensions: [
      { key: 'change', label: 'Veraenderung', experienceLabel: 'Veraenderung', description: 'Wie gehst du mit schnellen Veraenderungen um?' },
      { key: 'uncertainty', label: 'Ungewissheit', experienceLabel: 'Ungewissheit', description: 'Wie triffst du Entscheidungen ohne alle Infos?' },
      { key: 'complexity', label: 'Vernetzung', experienceLabel: 'Vernetzung', description: 'Wie verstehst du komplexe Zusammenhaenge?' },
      { key: 'ambiguity', label: 'Vieldeutigkeit', experienceLabel: 'Vieldeutigkeit', description: 'Wie gehst du mit Mehrdeutigkeit um?' },
    ],
  },
  entrepreneur: {
    type: 'entrepreneur',
    title: 'Gruender-Werkstatt',
    subtitle: 'Mach deine Ideen real',
    description: 'Entwickle eigene Ideen, teste sie an der Realitaet und lerne, was es heisst, etwas Neues zu schaffen.',
    icon: '🚀',
    colorClass: 'text-orange-400',
    glowClass: 'glow-orange',
    gradientClass: 'gradient-orange',
    bgClass: 'bg-orange-500/10',
    dimensions: [
      { key: 'creativity', label: 'Kreativitaet', experienceLabel: 'Kreativitaet', description: 'Wie kreativ loest du Probleme?' },
      { key: 'initiative', label: 'Eigeninitiative', experienceLabel: 'Eigeninitiative', description: 'Wie stark ergreifst du die Initiative?' },
      { key: 'resilience', label: 'Durchhaltevermoegen', experienceLabel: 'Durchhaltevermoegen', description: 'Wie gehst du mit Rueckschlaegen um?' },
      { key: 'value-creation', label: 'Wertschoepfung', experienceLabel: 'Wertschoepfung', description: 'Wie gut erkennst du, was anderen hilft?' },
    ],
  },
  'self-learning': {
    type: 'self-learning',
    title: 'Lern-Labor',
    subtitle: 'Werde dein eigener Lehrer',
    description: 'Entdecke Lerntechniken und wende sie direkt auf deine eigenen Interessen an.',
    icon: '🧪',
    colorClass: 'text-purple-400',
    glowClass: 'glow-purple',
    gradientClass: 'gradient-purple',
    bgClass: 'bg-purple-500/10',
    dimensions: [
      { key: 'metacognition', label: 'Selbstreflexion', experienceLabel: 'Selbstreflexion', description: 'Wie gut kennst du deinen Lernstil?' },
      { key: 'transfer', label: 'Wissenstransfer', experienceLabel: 'Wissenstransfer', description: 'Wie gut uebertraegst du Gelerntes?' },
      { key: 'curiosity', label: 'Neugier', experienceLabel: 'Neugier', description: 'Wie stark treibt dich Neugier an?' },
      { key: 'persistence', label: 'Ausdauer', experienceLabel: 'Ausdauer', description: 'Wie lange bleibst du an schwierigen Themen dran?' },
      { key: 'self-direction', label: 'Selbststeuerung', experienceLabel: 'Selbststeuerung', description: 'Wie gut planst du dein eigenes Lernen?' },
    ],
  },
};

export const ALL_DIMENSIONS = Object.values(JOURNEYS).flatMap(j => j.dimensions);
