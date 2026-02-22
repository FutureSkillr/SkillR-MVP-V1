const errorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Ein Konto mit dieser E-Mail existiert bereits.',
  'auth/invalid-email': 'Ungueltige E-Mail-Adresse.',
  'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
  'auth/user-not-found': 'E-Mail oder Passwort falsch.',
  'auth/wrong-password': 'E-Mail oder Passwort falsch.',
  'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
  'auth/weak-password': 'Passwort muss mindestens 6 Zeichen haben.',
  'auth/popup-closed-by-user': 'Anmeldung abgebrochen.',
  'auth/cancelled-popup-request': 'Anmeldung abgebrochen.',
  'auth/popup-blocked': 'Pop-up wurde blockiert. Bitte erlaube Pop-ups fuer diese Seite.',
  'auth/account-exists-with-different-credential': 'Ein Konto mit dieser E-Mail existiert bereits mit einer anderen Anmeldemethode.',
  'auth/network-request-failed': 'Netzwerkfehler. Bitte pruefe deine Internetverbindung.',
  'auth/too-many-requests': 'Zu viele Anmeldeversuche. Bitte versuche es spaeter erneut.',
  'auth/operation-not-allowed': 'Diese Anmeldemethode ist nicht aktiviert.',
};

export function getFirebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return errorMessages[code] || `Authentifizierungsfehler (${code}).`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten.';
}
