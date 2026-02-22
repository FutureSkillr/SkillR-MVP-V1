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

interface DatenschutzPageProps {
  onBack: () => void;
  onNavigate: (page: 'datenschutz' | 'impressum') => void;
  onOpenCookieSettings: () => void;
}

export const DatenschutzPage: React.FC<DatenschutzPageProps> = ({
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
            <span className="gradient-text">Datenschutzerklaerung</span>
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <p className="text-xs text-slate-500">
            DSGVO Art. 12/13 — Informationspflichten bei Erhebung personenbezogener Daten
          </p>

          {/* 1. Verantwortliche Stelle */}
          <Section title="1. Verantwortliche Stelle">
            <p>
              {cfg('company_name')}<br />
              {cfg('company_address')}<br />
              E-Mail: <a href={`mailto:${cfg('contact_email')}`} className="text-blue-400 hover:underline">{cfg('contact_email')}</a>
            </p>
          </Section>

          {/* 2. Welche Daten wir erheben */}
          <Section title="2. Welche Daten wir erheben">
            <h3 className="font-semibold text-slate-200 text-sm mt-3">2.1 Registrierungsdaten</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>E-Mail-Adresse</li>
              <li>Anzeigename</li>
              <li>Authentifizierungsanbieter (Google, E-Mail)</li>
            </ul>

            <h3 className="font-semibold text-slate-200 text-sm mt-4">2.2 Nutzungsdaten (pseudonymisiert)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Browser-Session-ID (zufaellig generiert, kein Tracking ueber Sessions hinweg)</li>
              <li>Seitenaufrufe und Klickpfade</li>
              <li>Warteraum-Interaktionen</li>
              <li>Gewaehlter Coach</li>
            </ul>

            <h3 className="font-semibold text-slate-200 text-sm mt-4">2.3 Gespraeche mit KI-Coaches</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Texteingaben im Chat mit dem KI-Coach</li>
              <li>Extrahierte Interessen und Staerken (automatisch analysiert)</li>
              <li>Lernfortschritte und VUCA-Bingo-Status</li>
            </ul>

            <h3 className="font-semibold text-slate-200 text-sm mt-4">2.4 Technische Daten</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP-Adresse (anonymisiert/gehasht in Logs)</li>
              <li>Browser-Typ und Viewport-Groesse</li>
              <li>Zeitstempel der Zugriffe</li>
            </ul>
          </Section>

          {/* 3. Rechtsgrundlage */}
          <Section title="3. Rechtsgrundlage (Art. 6 DSGVO)">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-slate-300 font-semibold">Zweck</th>
                    <th className="text-left py-2 text-slate-300 font-semibold">Rechtsgrundlage</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Registrierung und Login</td>
                    <td className="py-2">Art. 6 Abs. 1 lit. b (Vertragsdurchfuehrung)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">KI-Coach-Gespraeche</td>
                    <td className="py-2">Art. 6 Abs. 1 lit. b (Vertragsdurchfuehrung)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Internes Analytics</td>
                    <td className="py-2">Art. 6 Abs. 1 lit. f (berechtigtes Interesse)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Meta Pixel / Marketing</td>
                    <td className="py-2">Art. 6 Abs. 1 lit. a (Einwilligung)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Sicherheit / Rate Limiting</td>
                    <td className="py-2">Art. 6 Abs. 1 lit. f (berechtigtes Interesse)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 4. Empfaenger */}
          <Section title="4. Empfaenger der Daten">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4 text-slate-300 font-semibold">Dienst</th>
                    <th className="text-left py-2 pr-4 text-slate-300 font-semibold">Zweck</th>
                    <th className="text-left py-2 text-slate-300 font-semibold">Standort</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Google Cloud Run</td>
                    <td className="py-2 pr-4">Hosting</td>
                    <td className="py-2">EU / US</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Google Gemini API</td>
                    <td className="py-2 pr-4">KI-Coach-Antworten</td>
                    <td className="py-2">US</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Google Firebase</td>
                    <td className="py-2 pr-4">Authentifizierung</td>
                    <td className="py-2">EU / US</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">PostgreSQL (Cloud SQL)</td>
                    <td className="py-2 pr-4">Nutzerdaten</td>
                    <td className="py-2">EU</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 5. Speicherdauer */}
          <Section title="5. Speicherdauer">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-slate-200">Nutzerkonto-Daten:</strong> Bis zur Loeschung des Kontos</li>
              <li><strong className="text-slate-200">Chat-Verlaeufe:</strong> 90 Tage nach Session-Ende</li>
              <li><strong className="text-slate-200">Analytics-Events:</strong> 12 Monate, dann anonymisiert</li>
              <li><strong className="text-slate-200">Logs:</strong> 30 Tage</li>
            </ul>
          </Section>

          {/* 6. Deine Rechte */}
          <Section title="6. Deine Rechte (Art. 15-22 DSGVO)">
            <p>Du hast das Recht auf:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-slate-200">Auskunft</strong> (Art. 15): Welche Daten wir ueber dich speichern</li>
              <li><strong className="text-slate-200">Berichtigung</strong> (Art. 16): Falsche Daten korrigieren lassen</li>
              <li><strong className="text-slate-200">Loeschung</strong> (Art. 17): Dein Konto und alle Daten loeschen lassen</li>
              <li><strong className="text-slate-200">Datenportabilitaet</strong> (Art. 20): Deine Daten in maschinenlesbarem Format erhalten</li>
              <li><strong className="text-slate-200">Widerspruch</strong> (Art. 21): Der Verarbeitung widersprechen</li>
              <li><strong className="text-slate-200">Widerruf der Einwilligung</strong> (Art. 7 Abs. 3): Cookie-Einwilligung jederzeit widerrufen</li>
            </ul>

            <div className="glass rounded-xl p-4 mt-4 space-y-2">
              <h3 className="font-semibold text-slate-200 text-sm">So uebst du deine Rechte aus:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong className="text-slate-200">Konto loeschen:</strong> Einstellungen &rarr; Konto loeschen</li>
                <li><strong className="text-slate-200">Daten exportieren:</strong> Profil &rarr; Daten exportieren</li>
                <li>
                  <strong className="text-slate-200">Cookie-Einwilligung widerrufen:</strong>{' '}
                  <button
                    onClick={onOpenCookieSettings}
                    className="text-blue-400 hover:underline"
                  >
                    Cookie-Einstellungen oeffnen
                  </button>
                </li>
              </ul>
            </div>
          </Section>

          {/* 7. Jugendschutz */}
          <Section title="7. Jugendschutz (JMStV §5, Art. 8 DSGVO)">
            <ul className="list-disc list-inside space-y-1">
              <li>Die App richtet sich an Jugendliche ab 14 Jahren.</li>
              <li>Bei 14-15-Jaehrigen empfehlen wir die Einwilligung der Erziehungsberechtigten.</li>
              <li>KI-Antworten werden durch Safety-Filter geschuetzt (Harm-Schwellwerte).</li>
              <li>Es werden keine Karriereempfehlungen gegeben — nur Interessen-Exploration.</li>
            </ul>
          </Section>

          {/* 8. Cookies */}
          <Section title="8. Cookies und Tracking">
            <h3 className="font-semibold text-slate-200 text-sm mt-2">Technisch notwendige Cookies</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Session-Token (httpOnly, SameSite=Strict)</li>
              <li>Consent-Entscheidung (localStorage)</li>
            </ul>

            <h3 className="font-semibold text-slate-200 text-sm mt-4">Optionale Cookies (nur nach Einwilligung)</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Meta Pixel (Facebook) fuer Kampagnen-Messung</li>
            </ul>

            <p className="mt-4">
              Du kannst deine Cookie-Einstellungen jederzeit aendern:{' '}
              <button
                onClick={onOpenCookieSettings}
                className="text-blue-400 hover:underline"
              >
                Cookie-Einstellungen oeffnen
              </button>
            </p>
          </Section>

          {/* 9. Aenderungen */}
          <Section title="9. Aenderungen">
            <p>
              Wir behalten uns vor, diese Datenschutzerklaerung anzupassen.
              Die aktuelle Version ist immer unter{' '}
              <button
                onClick={() => onNavigate('datenschutz')}
                className="text-blue-400 hover:underline"
              >
                /datenschutz
              </button>{' '}
              abrufbar.
            </p>
          </Section>

          {/* 10. Kontakt */}
          <Section title="10. Kontakt">
            <p>
              Bei Fragen zum Datenschutz wende dich an:{' '}
              <a href={`mailto:${brand.contactEmail}`} className="text-blue-400 hover:underline">
                {brand.contactEmail}
              </a>
            </p>
          </Section>

          <p className="text-xs text-slate-500 pt-4">Stand: Februar 2026</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-light px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} {brand.copyrightHolder}</span>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate('impressum')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Impressum
            </button>
            <button onClick={() => onNavigate('datenschutz')} className="text-slate-400 cursor-default min-h-[44px] inline-flex items-center">
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold text-white">{title}</h2>
    <div className="glass rounded-xl p-5 text-sm text-slate-300 space-y-2">
      {children}
    </div>
  </section>
);
