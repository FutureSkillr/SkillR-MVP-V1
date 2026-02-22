import React from 'react';
import { getConsentLevel, setConsentLevel, revokeConsent } from '../../services/consent';

interface CookieSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConsentChange: (level: 'all' | 'necessary') => void;
}

export const CookieSettingsModal: React.FC<CookieSettingsModalProps> = ({
  open,
  onClose,
  onConsentChange,
}) => {
  if (!open) return null;

  const currentLevel = getConsentLevel();

  const handleAcceptAll = () => {
    setConsentLevel('all');
    onConsentChange('all');
    onClose();
  };

  const handleNecessaryOnly = () => {
    if (currentLevel === 'all') {
      revokeConsent();
      setConsentLevel('necessary');
    }
    onConsentChange('necessary');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass rounded-2xl border border-white/10 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">Cookie-Einstellungen</h2>
          <p className="text-sm text-slate-400">
            Hier kannst du deine Cookie-Einstellungen einsehen und aendern.
            Du kannst deine Einwilligung jederzeit widerrufen (DSGVO Art. 7 Abs. 3).
          </p>
        </div>

        {/* Current status */}
        <div className="glass rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentLevel === 'all' ? 'bg-green-400' : currentLevel === 'necessary' ? 'bg-yellow-400' : 'bg-slate-500'}`} />
            <span className="text-sm font-medium text-white">
              Aktueller Status:{' '}
              {currentLevel === 'all' && 'Alle Cookies akzeptiert'}
              {currentLevel === 'necessary' && 'Nur notwendige Cookies'}
              {currentLevel === 'undecided' && 'Noch keine Entscheidung'}
            </span>
          </div>
        </div>

        {/* Cookie categories */}
        <div className="space-y-3">
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Technisch notwendig</h3>
              <span className="text-xs text-green-400 font-medium px-2 py-0.5 rounded-full bg-green-400/10">Immer aktiv</span>
            </div>
            <p className="text-xs text-slate-400">
              Session-Verwaltung, Consent-Speicherung, Sicherheitsfunktionen.
              Diese Cookies sind fuer den Betrieb der App erforderlich und koennen nicht deaktiviert werden.
            </p>
          </div>

          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Marketing & Analyse</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${currentLevel === 'all' ? 'text-green-400 bg-green-400/10' : 'text-slate-500 bg-slate-500/10'}`}>
                {currentLevel === 'all' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Meta Pixel fuer Kampagnen-Messung. Wird nur geladen, wenn du
              "Alle akzeptieren" waehlst. Ohne diese Cookies funktioniert die App
              vollstaendig — du verpasst nichts.
            </p>
          </div>
        </div>

        {/* Actions — equally styled per TTDSG */}
        <div className="flex gap-3">
          <button
            onClick={handleNecessaryOnly}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Nur notwendige
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Alle akzeptieren
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          Hinweis fuer 14-15-Jaehrige: Bitte besprich diese Entscheidung mit deinen Eltern.
        </p>
      </div>
    </div>
  );
};
