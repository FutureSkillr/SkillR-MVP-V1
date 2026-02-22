export type UserRole = 'admin' | 'user';
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authProvider: AuthProvider;
  photoURL?: string;
  createdAt: number;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authProvider: AuthProvider;
  photoURL?: string;
  passwordHash: string;
  createdAt: number;
}
