import { describe, it, expect } from 'vitest';
import { getFirebaseErrorMessage } from './firebaseErrors';

describe('getFirebaseErrorMessage', () => {
  it('returns mapped message for known Firebase error code', () => {
    const error = { code: 'auth/email-already-in-use' };
    expect(getFirebaseErrorMessage(error)).toBe(
      'Ein Konto mit dieser E-Mail existiert bereits.'
    );
  });

  it('returns mapped message for wrong-password', () => {
    const error = { code: 'auth/wrong-password' };
    expect(getFirebaseErrorMessage(error)).toBe('E-Mail oder Passwort falsch.');
  });

  it('returns mapped message for weak-password', () => {
    const error = { code: 'auth/weak-password' };
    expect(getFirebaseErrorMessage(error)).toBe(
      'Passwort muss mindestens 6 Zeichen haben.'
    );
  });

  it('returns generic message for unknown Firebase error code', () => {
    const error = { code: 'auth/unknown-code' };
    expect(getFirebaseErrorMessage(error)).toBe(
      'Authentifizierungsfehler (auth/unknown-code).'
    );
  });

  it('returns Error.message for plain Error instances', () => {
    expect(getFirebaseErrorMessage(new Error('custom error'))).toBe('custom error');
  });

  it('returns fallback message for null', () => {
    expect(getFirebaseErrorMessage(null)).toBe(
      'Ein unbekannter Fehler ist aufgetreten.'
    );
  });

  it('returns fallback message for undefined', () => {
    expect(getFirebaseErrorMessage(undefined)).toBe(
      'Ein unbekannter Fehler ist aufgetreten.'
    );
  });

  it('returns fallback message for non-object', () => {
    expect(getFirebaseErrorMessage('string error')).toBe(
      'Ein unbekannter Fehler ist aufgetreten.'
    );
  });

  it('returns mapped message for popup-closed-by-user', () => {
    const error = { code: 'auth/popup-closed-by-user' };
    expect(getFirebaseErrorMessage(error)).toBe('Anmeldung abgebrochen.');
  });

  it('returns mapped message for network error', () => {
    const error = { code: 'auth/network-request-failed' };
    expect(getFirebaseErrorMessage(error)).toBe(
      'Netzwerkfehler. Bitte pruefe deine Internetverbindung.'
    );
  });
});
