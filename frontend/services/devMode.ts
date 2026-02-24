/**
 * Dev mode detection (FR-130).
 * The backend sets devMode=true when not running on Cloud Run.
 * The bootstrap in index.tsx stores it as SKILLR_DEV_MODE in globalThis.
 */
export function isDevMode(): boolean {
  try {
    return (globalThis as any).process?.env?.SKILLR_DEV_MODE === 'true';
  } catch {
    return false;
  }
}
