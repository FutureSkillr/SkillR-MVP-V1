import type { AuthUser, AuthProvider, UserRole } from '../types/auth';

const SESSION_KEY = 'skillr-session';
const TOKEN_KEY = 'skillr-token';

/** Returns auth headers for admin API calls. */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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

  const body = await res.json();
  // Backend wraps the response: { "user": {...}, "token": "..." }
  const authUser: AuthUser = body.user ?? body;
  if (body.token) {
    localStorage.setItem(TOKEN_KEY, body.token);
  }
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
  localStorage.removeItem(TOKEN_KEY);
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
  const res = await fetch('/api/users', { headers: getAuthHeaders() });
  if (!res.ok) {
    console.warn('[auth] GET /api/users failed:', res.status);
    // Fallback: return the currently logged-in user so the admin panel is not empty
    const current = getCurrentUser();
    return current ? [current] : [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function seedDefaultAdmin(): void {
  // No-op: server seeds the admin user on startup
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const res = await fetch(`/api/users/${userId}/role`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
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
  const res = await fetch(`/api/users/${userId}`, { method: 'DELETE', headers: getAuthHeaders() });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Benutzer konnte nicht geloescht werden.');
  }
}
