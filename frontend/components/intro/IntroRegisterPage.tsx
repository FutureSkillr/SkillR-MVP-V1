import React, { useState } from 'react';
import { register } from '../../services/auth';
import { isFirebaseConfigured } from '../../services/firebase';
import { firebaseRegister, firebaseLoginWithProvider } from '../../services/firebaseAuth';
import { SocialLoginButton } from '../SocialLoginButton';
import { useBrand } from '../../contexts/BrandContext';
import type { AuthUser, AuthProvider } from '../../types/auth';

interface IntroRegisterPageProps {
  onRegister: (user: AuthUser) => void;
  onLoginInstead: () => void;
  earnedXP: number;
}

type AgeGroup = null | 'under14' | '14-15' | '16plus';

function getAgeGroup(birthYear: number): AgeGroup {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age < 14) return 'under14';
  if (age <= 15) return '14-15';
  return '16plus';
}

export const IntroRegisterPage: React.FC<IntroRegisterPageProps> = ({
  onRegister,
  onLoginInstead,
  earnedXP,
}) => {
  const { brand } = useBrand();
  const [birthYear, setBirthYear] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [parentalAcknowledged, setParentalAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const useFirebase = isFirebaseConfigured();

  const handleAgeCheck = () => {
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1950 || year > new Date().getFullYear()) {
      setError('Bitte gib ein gueltiges Geburtsjahr ein.');
      return;
    }
    setError(null);
    setAgeGroup(getAgeGroup(year));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!displayName.trim()) throw new Error('Bitte gib einen Namen ein.');
      if (!privacyAccepted) throw new Error('Bitte akzeptiere die Datenschutzerklaerung.');
      if (ageGroup === '14-15' && !parentalAcknowledged) {
        throw new Error('Bitte bestaetige, dass du deinen Eltern diese Seite zeigst.');
      }

      const user = useFirebase
        ? await firebaseRegister(email.trim(), displayName.trim(), password)
        : await register(email.trim(), displayName.trim(), password);
      onRegister(user);
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
      if (!privacyAccepted) throw new Error('Bitte akzeptiere die Datenschutzerklaerung.');
      const user = useFirebase
        ? await firebaseLoginWithProvider(provider)
        : await firebaseLoginWithProvider(provider);
      onRegister(user);
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // Under 14: blocked
  if (ageGroup === 'under14') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <span className="text-4xl">&#128682;</span>
          </div>
          <h1 className="text-2xl font-bold">Leider noch nicht</h1>
          <p className="text-slate-400">
            {brand.brandName} ist fuer Jugendliche ab 14 Jahren. Komm bald wieder!
          </p>
          <button
            onClick={onLoginInstead}
            className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            Zurueck zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="w-full sm:max-w-md space-y-6">
        {/* XP Badge */}
        {earnedXP > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span>&#11088;</span>
              <span className="text-sm font-bold text-purple-300">+{earnedXP} XP warten auf dich!</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold">
            <span className="gradient-text">Fortschritt sichern</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Erstelle ein Konto, damit dein Skill-Punkt und deine Entdeckungen gespeichert werden.
          </p>
        </div>

        {/* Age Gate (if not checked yet) */}
        {ageGroup === null && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-center">Wie alt bist du?</h2>
            <p className="text-xs text-slate-400 text-center">
              Wir fragen dein Geburtsjahr, um den Datenschutz einzuhalten (DSGVO).
            </p>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="z.B. 2010"
              min="1950"
              max={new Date().getFullYear()}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors text-center"
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              onClick={handleAgeCheck}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm"
            >
              Weiter
            </button>
          </div>
        )}

        {/* Registration form (14+ only) */}
        {(ageGroup === '14-15' || ageGroup === '16plus') && (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-xl font-bold text-center">Registrieren</h2>

            {/* Parental notice for 14-15 */}
            {ageGroup === '14-15' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
                <p className="text-amber-300 text-sm font-medium">Hinweis fuer 14-15-Jaehrige</p>
                <p className="text-amber-200/70 text-xs">
                  Bitte zeige deinen Eltern diese Seite, damit sie wissen, was {brand.brandName} ist und welche Daten gespeichert werden.
                </p>
                <label className="flex items-start gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={parentalAcknowledged}
                    onChange={(e) => setParentalAcknowledged(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded"
                  />
                  <span className="text-xs text-amber-200/70">
                    Ich zeige meinen Eltern diese Seite
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dein Name"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
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
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                required
              />
            </div>

            {/* Privacy checkbox */}
            <label className="flex items-start gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded"
              />
              <span className="text-xs text-slate-400">
                Ich akzeptiere die{' '}
                <a href="/datenschutz" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                  Datenschutzerklaerung
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-base sm:text-sm min-h-[48px]"
            >
              {loading ? 'Laden...' : 'Konto erstellen'}
            </button>

            {/* Social login */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">oder</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="space-y-3">
              <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} disabled={loading} />
              <SocialLoginButton provider="apple" onClick={() => handleSocialLogin('apple')} disabled={loading} />
            </div>

            <p className="text-center text-xs text-slate-500">
              Schon registriert?{' '}
              <button
                type="button"
                onClick={onLoginInstead}
                className="text-blue-400 hover:text-blue-300 underline transition-colors min-h-[44px] inline-flex items-center"
              >
                Anmelden
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
