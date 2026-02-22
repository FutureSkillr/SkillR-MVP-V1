import React, { useState, useEffect } from 'react';
import { setConsentLevel, hasConsentDecision } from '../services/consent';

interface CookieConsentBannerProps {
  onConsent: (level: 'all' | 'necessary') => void;
  onOpenDatenschutz?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onConsent,
  onOpenDatenschutz,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasConsentDecision()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    setConsentLevel('all');
    setVisible(false);
    onConsent('all');
  };

  const handleNecessaryOnly = () => {
    setConsentLevel('necessary');
    setVisible(false);
    onConsent('necessary');
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-slide-up" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-xl mx-auto glass rounded-2xl border border-white/10 p-5 shadow-2xl space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-white">Datenschutz & Cookies</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Wir nutzen technisch notwendige Cookies fuer den Betrieb der App.
            Mit "Alle akzeptieren" erlaubst du uns zusaetzlich, anonyme Nutzungsdaten
            fuer Werbung und Verbesserung zu erheben (Meta Pixel).
            Du kannst deine Wahl jederzeit in den{' '}
            <span className="text-slate-300">Cookie-Einstellungen</span> aendern.{' '}
            {onOpenDatenschutz ? (
              <button
                onClick={onOpenDatenschutz}
                className="text-blue-400 hover:underline"
              >
                Datenschutzerklaerung
              </button>
            ) : (
              <a href="/datenschutz" className="text-blue-400 hover:underline">
                Datenschutzerklaerung
              </a>
            )}
          </p>
          <p className="text-[10px] text-slate-500">
            Hinweis fuer 14-15-Jaehrige: Bitte besprich diese Entscheidung mit deinen Eltern.
          </p>
        </div>

        {/* TTDSG: Both buttons equally styled — no dark patterns */}
        <div className="flex gap-3">
          <button
            onClick={handleNecessaryOnly}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Nur notwendige
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
};
