import React, { useEffect, useState } from 'react';
import { useBrand } from '../../contexts/BrandContext';

const PLACEHOLDER = '[Bitte im Admin-Bereich konfigurieren]';

function useBusinessConfig() {
  const [config, setConfig] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch('/api/config/legal')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);
  return (key: string) => config[key] || PLACEHOLDER;
}

interface ImpressumPageProps {
  onBack: () => void;
  onNavigate: (page: 'datenschutz' | 'impressum') => void;
  onOpenCookieSettings: () => void;
}

export const ImpressumPage: React.FC<ImpressumPageProps> = ({
  onBack,
  onNavigate,
  onOpenCookieSettings,
}) => {
  const { brand } = useBrand();
  const cfg = useBusinessConfig();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">
            <span className="gradient-text">Impressum</span>
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto prose-legal space-y-8">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white">Angaben gemaess TMG §5</h2>
            <div className="glass rounded-xl p-5 space-y-3 text-sm text-slate-300">
              <p className="font-semibold text-white">{cfg('company_name')}</p>
              <p>
                {cfg('company_address')}<br />
                {cfg('company_country') !== PLACEHOLDER ? cfg('company_country') : 'Deutschland'}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Kontakt</h2>
            <div className="glass rounded-xl p-5 space-y-2 text-sm text-slate-300">
              <p>E-Mail: <a href={`mailto:${cfg('contact_email')}`} className="text-blue-400 hover:underline">{cfg('contact_email')}</a></p>
              <p>Telefon: {cfg('contact_phone')}</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Vertretungsberechtigte Person</h2>
            <p className="text-sm text-slate-300">{cfg('legal_representative')}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Registereintrag</h2>
            <p className="text-sm text-slate-400 italic">
              {cfg('register_entry')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Umsatzsteuer-ID</h2>
            <p className="text-sm text-slate-400 italic">
              {cfg('vat_id')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Verantwortlich fuer den Inhalt (§55 Abs. 2 RStV)</h2>
            <p className="text-sm text-slate-300">
              {cfg('content_responsible')}<br />
              {cfg('content_responsible_address')}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">EU-Streitschlichtung</h2>
            <p className="text-sm text-slate-300">
              Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="text-sm text-slate-400">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">Haftungsausschluss</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-slate-200">Haftung fuer Inhalte</h3>
                <p>
                  Die Inhalte dieser App wurden mit groesster Sorgfalt erstellt.
                  Fuer die Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte
                  uebernehmen wir jedoch keine Gewaehr. Als Diensteanbieter sind wir
                  gemaess §7 Abs. 1 TMG fuer eigene Inhalte verantwortlich.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">KI-generierte Inhalte</h3>
                <p>
                  Diese App nutzt kuenstliche Intelligenz (Google Gemini) fuer
                  dialogbasierte Interaktionen. KI-generierte Inhalte dienen
                  ausschliesslich der Interessen-Exploration und stellen keine
                  Karriereberatung, Berufsempfehlung oder verbindliche Auskunft dar.
                </p>
              </div>
            </div>
          </section>

          <p className="text-xs text-slate-500 pt-4">Stand: Februar 2026</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-light px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} {brand.copyrightHolder}</span>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate('impressum')} className="text-slate-400 cursor-default min-h-[44px] inline-flex items-center">
              Impressum
            </button>
            <button onClick={() => onNavigate('datenschutz')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Datenschutz
            </button>
            <button onClick={onOpenCookieSettings} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Cookie-Einstellungen
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
