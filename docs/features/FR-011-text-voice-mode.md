# FR-011: Text and Voice Mode Switching

**Status:** draft
**Priority:** should
**Created:** 2026-02-17

## Scope
Users can interact with the AI coach via text input, voice input, or both. The mode can be switched at any time — e.g., text mode on the bus, voice mode at home. The system must handle both input types seamlessly without losing dialogue context. Speech-to-text for voice input, text-to-speech for voice output, and plain text are all valid interaction paths.

## Intent
Meet users where they are. Context changes constantly for teenagers — quiet classroom, noisy bus, alone at home. Forcing a single interaction mode excludes real usage scenarios. Flexibility here directly translates to session length and return rate.

## Dependencies
- FR-005 (Gemini AI dialogue engine)
- FR-010 (AI coach voice)
