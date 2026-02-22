import type { AuthUser, AuthProvider, UserRole } from '../types/auth';

const SESSION_KEY = 'future-skiller-session';

export async function register(
  email: string,
  displayName: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName, password }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Registrierung fehlgeschlagen.');
  }

  const authUser: AuthUser = await res.json();
  localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  return authUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'E-Mail oder Passwort falsch.');
  }

  const authUser: AuthUser = await res.json();
  localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  return authUser;
}

export async function loginWithProvider(provider: AuthProvider): Promise<AuthUser> {
  const res = await fetch('/api/auth/login-provider', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Login fehlgeschlagen.');
  }

  const authUser: AuthUser = await res.json();
  localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  return authUser;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed.authProvider) parsed.authProvider = 'email';
    return parsed;
  } catch {
    return null;
  }
}

export async function getAllUsers(): Promise<AuthUser[]> {
  const res = await fetch('/api/users');
  return res.json();
}

export function seedDefaultAdmin(): void {
  // No-op: server seeds the admin user on startup
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const res = await fetch(`/api/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: newRole }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Rolle konnte nicht aktualisiert werden.');
  }

  // Update session if the changed user is the current user
  const current = getCurrentUser();
  if (current && current.id === userId) {
    const updated = { ...current, role: newRole };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Benutzer konnte nicht geloescht werden.');
  }
}
