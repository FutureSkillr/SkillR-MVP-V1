import type { LernreiseDefinition } from '../types/journey';
import { DEFAULT_LERNREISEN } from '../constants/lernreisen';

let cachedLernreisen: LernreiseDefinition[] | null = null;

/** Fetch the Lernreise content pack from the backend API, falling back to hardcoded defaults. */
export async function fetchContentPack(): Promise<LernreiseDefinition[]> {
  if (cachedLernreisen) return cachedLernreisen;
  try {
    const res = await fetch('/api/v1/content-pack');
    if (res.ok) {
      const data = await res.json();
      const result: LernreiseDefinition[] = data.lernreisen ?? [];
      cachedLernreisen = result;
      return result;
    }
  } catch {
    /* fallback to defaults */
  }
  cachedLernreisen = DEFAULT_LERNREISEN;
  return DEFAULT_LERNREISEN;
}
