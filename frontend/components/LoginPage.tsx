import React, { useState } from 'react';
import { register, login, loginWithProvider } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';
import { firebaseRegister, firebaseLogin, firebaseLoginWithProvider } from '../services/firebaseAuth';
import { SocialLoginButton } from './SocialLoginButton';
import type { AuthUser, AuthProvider } from '../types/auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const useFirebase = isFirebaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: AuthUser;
      if (mode === 'register') {
        if (!displayName.trim()) {
          throw new Error('Bitte gib einen Namen ein.');
        }
        user = useFirebase
          ? await firebaseRegister(email.trim(), displayName.trim(), password)
          : await register(email.trim(), displayName.trim(), password);
      } else {
        user = useFirebase
          ? await firebaseLogin(email.trim(), password)
          : await login(email.trim(), password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: AuthProvider) => {
    setError(null);
    setLoading(true);

    try {
      const user = useFirebase
        ? await firebaseLoginWithProvider(provider)
        : await loginWithProvider(provider);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold">
            <span className="gradient-text">SkillR</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {mode === 'login'
              ? 'Melde dich an, um deine Reise fortzusetzen.'
              : 'Erstelle ein Konto, um loszulegen.'}
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
          <h2 className="text-xl font-bold text-center">
            {mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">E-Mail</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              minLength={6}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all text-sm"
          >
            {loading
              ? 'Laden...'
              : mode === 'login'
                ? 'Anmelden'
                : 'Konto erstellen'}
          </button>

          {/* Social login divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">oder</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social login buttons */}
          <div className="space-y-3">
            <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} disabled={loading} />
            <SocialLoginButton provider="apple" onClick={() => handleSocialLogin('apple')} disabled={loading} />
            <SocialLoginButton provider="facebook" onClick={() => handleSocialLogin('facebook')} disabled={loading} />
          </div>

          <p className="text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <>
                Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Registrieren
                </button>
              </>
            ) : (
              <>
                Bereits registriert?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Anmelden
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};
