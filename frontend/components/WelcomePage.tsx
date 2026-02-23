import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPartnerList } from '../services/partner';
import type { PartnerSummary } from '../types/partner';

interface WelcomePageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onPartnerClick?: (slug: string) => void;
  onNavigate?: (page: 'datenschutz' | 'impressum') => void;
  onOpenCookieSettings?: () => void;
}

type Stakeholder = 'kids' | 'parents' | 'companies' | 'coaches' | 'ihk' | 'arbeitsagentur';

const stakeholders: {
  key: Stakeholder;
  role: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  glowClass: string;
  gradientClass: string;
  tagline: string;
  bullets: string[];
}[] = [
  {
    key: 'kids',
    role: 'Der Entdecker',
    label: 'Jugendliche',
    color: 'text-blue-400',
    glowClass: 'glow-blue',
    gradientClass: 'gradient-blue',
    tagline: 'Finde heraus, was in dir steckt — ohne Tests, ohne Noten.',
    bullets: [
      'Starte mit irgendeinem Interesse — Kochen, Gaming, Musik, egal was',
      'Erlebe eine KI-gefuehrte Reise durch echte Orte und Geschichten',
      'Bekomme ein Skill-Profil, das sich anfuehlt wie du selbst',
      'Dein Reisetagebuch waechst mit jeder Entdeckung',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
    ),
  },
  {
    key: 'parents',
    role: 'Der Motivator',
    label: 'Eltern',
    color: 'text-orange-400',
    glowClass: 'glow-orange',
    gradientClass: 'gradient-orange',
    tagline: 'Verstehen, was Ihr Kind entdeckt — ohne es zu steuern.',
    bullets: [
      'Interesse-Cluster und VUCA-Fortschritt auf einen Blick',
      'Meilenstein-Benachrichtigungen bei wichtigen Etappen',
      'Klare Datenschutz-Grenze: Fortschritt ja, Gespraeche nein',
      'Keine Noten, kein Druck — nur Entdeckung',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    ),
  },
  {
    key: 'companies',
    role: 'Der Mentor',
    label: 'Unternehmen',
    color: 'text-emerald-400',
    glowClass: '',
    gradientClass: '',
    tagline: 'Finden Sie Talente, die wirklich zu Ihnen passen.',
    bullets: [
      'Bildungssponsoring statt Werbung — Sichtbarkeit durch Wissen',
      'Beschreiben Sie Ihren Moeglichkeitsraum und Wachstumspfade',
      'Consent-basiertes Matching bei echtem Interesse',
      'Hoehere Passung, weniger Ausbildungsabbrueche',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    ),
  },
  {
    key: 'coaches',
    role: 'Der Reisebegleiter',
    label: 'Coaches',
    color: 'text-purple-400',
    glowClass: 'glow-purple',
    gradientClass: 'gradient-purple',
    tagline: 'Ihre Expertise. Skaliert fuer tausende Jugendliche.',
    bullets: [
      'Ihre Coaching-Methoden fliessen in die KI-Dialogstrategien ein',
      'Qualitaetssicherung und Feedback fuer KI-generierte Dialoge',
      'Gegensatzsuche und Level-2-Reflexion als Kernmethoden',
      'Neue Einnahmequelle durch Content-Lizenzen und Beratung',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    key: 'ihk',
    role: 'Der Wegweiser',
    label: 'IHK & Kammern',
    color: 'text-amber-400',
    glowClass: '',
    gradientClass: '',
    tagline: 'Die Ausbildungslandschaft sichtbar und attraktiv machen.',
    bullets: [
      'Alle Ausbildungsberufe im Einzugsgebiet — eingebettet in Erlebnisse',
      'Anonymisierte Aggregate-Analytics fuer Ihre Region',
      'Zukunftsberufe registrieren, die noch nicht im Katalog stehen',
      'Kammer-Dashboard mit regionalen Interesse-Trends',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    ),
  },
  {
    key: 'arbeitsagentur',
    role: 'Der Navigator',
    label: 'Arbeitsagentur',
    color: 'text-cyan-400',
    glowClass: '',
    gradientClass: '',
    tagline: 'Jugendliche dort erreichen, wo sie sind.',
    bullets: [
      'Ergaenzung zur Beratung — Jugendliche kommen vorbereitet ins Gespraech',
      'Berater starten mit einem Skill-Profil als Gespraechsbasis',
      'Anonymisierte Interesse-Trends fuer Massnahmenplanung',
      'Pilotprojekt: 3 Monate, 1 Region, messbare Ergebnisse',
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
  },
];

const emeraldGradient = { background: 'linear-gradient(135deg, #10b981, #06b6d4)' };
const amberGradient = { background: 'linear-gradient(135deg, #f59e0b, #f97316)' };
const cyanGradient = { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' };

function getGradientStyle(key: Stakeholder): React.CSSProperties | undefined {
  if (key === 'companies') return emeraldGradient;
  if (key === 'ihk') return amberGradient;
  if (key === 'arbeitsagentur') return cyanGradient;
  return undefined;
}

function getGlowStyle(key: Stakeholder): React.CSSProperties | undefined {
  if (key === 'companies') return { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' };
  if (key === 'ihk') return { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' };
  if (key === 'arbeitsagentur') return { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' };
  return undefined;
}

// --- Merch Products ---

const merchProducts = [
  {
    name: 'VUCA Grid Tee',
    price: '29,90',
    badge: 'BESTSELLER',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    desc: 'Vier Farben, vier Dimensionen — das VUCA-Bingo als Statement.',
    visual: (
      <div className="w-20 h-24 rounded-lg bg-slate-700/50 border border-slate-600/30 flex flex-col items-center justify-center gap-1.5 p-2">
        <div className="text-[8px] font-mono text-slate-500">V U C A</div>
        <div className="grid grid-cols-2 gap-1">
          <div className="w-5 h-5 rounded" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} />
          <div className="w-5 h-5 rounded" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }} />
          <div className="w-5 h-5 rounded" style={{ background: 'linear-gradient(135deg, #f97316, #eab308)' }} />
          <div className="w-5 h-5 rounded" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }} />
        </div>
      </div>
    ),
  },
  {
    name: 'SkillR Tasse',
    price: '14,90',
    badge: 'NEU',
    badgeColor: 'bg-pink-500/20 text-pink-400',
    desc: 'Matte Keramik, Gradient-Logo. Dein taeglicher Reisebegleiter.',
    visual: (
      <div className="relative">
        <div className="w-16 h-14 rounded-b-lg rounded-t-sm bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
          <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(90deg, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>S</div>
        </div>
        <div className="absolute top-2 -right-3 w-3 h-8 border-2 border-slate-600/30 rounded-r-full" />
      </div>
    ),
  },
  {
    name: 'Handyhuellen-Sticker',
    price: '4,90',
    badge: undefined,
    badgeColor: '',
    desc: '6er-Set Vinyl-Sticker fuer Handy, Laptop und mehr.',
    visual: (
      <div className="flex flex-wrap justify-center gap-1.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>V</div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>U</div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #f97316, #eab308)' }}>C</div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>A</div>
      </div>
    ),
  },
  {
    name: 'SkillR Cap',
    price: '24,90',
    badge: undefined,
    badgeColor: '',
    desc: 'Snapback mit gesticktem SR-Logo im Gradient-Style.',
    visual: (
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-12 rounded-t-full bg-slate-700/50 border border-slate-600/30 flex items-end justify-center pb-1">
          <div className="text-sm font-extrabold" style={{ background: 'linear-gradient(90deg, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SR</div>
        </div>
        <div className="w-24 h-2 bg-slate-700/50 rounded-full border border-slate-600/30" />
      </div>
    ),
  },
  {
    name: 'Entdecker Hoodie',
    price: '59,90',
    badge: 'PREMIUM',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    desc: 'Bio-Baumwolle, Oversize. "Bist Du ein SkillR?" auf dem Ruecken.',
    visual: (
      <div className="w-24 h-28 rounded-xl bg-slate-700/50 border border-slate-600/30 flex flex-col items-center justify-center gap-2 p-3">
        <div className="w-12 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444, #ec4899)' }} />
        <div className="text-xl font-extrabold" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>S</div>
        <div className="w-10 h-1 bg-slate-600 rounded-full" />
      </div>
    ),
  },
];

const MerchCarousel: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono tracking-wider">MERCH</div>
            <h2 className="text-3xl md:text-4xl font-bold">Rep dein SkillR Game.</h2>
            <p className="text-slate-400 text-sm max-w-md">Exklusiver Merch fuer die Community. Zeig der Welt, wer du bist.</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button onClick={() => scroll('left')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => scroll('right')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
          {merchProducts.map((p) => (
            <a key={p.name} href="/landing/merch.html" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl overflow-hidden flex-shrink-0 w-[220px] snap-start hover:scale-[1.03] transition-all group cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative p-6">
                {p.visual}
                {p.badge && <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${p.badgeColor}`}>{p.badge}</div>}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm group-hover:text-white transition-colors">{p.name}</h3>
                  <span className="text-xs font-bold text-purple-300 whitespace-nowrap px-2 py-0.5 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(168,85,247,0.3)' }}>{p.price}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </a>
          ))}
          <a href="/landing/merch.html" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl flex-shrink-0 w-[220px] snap-start flex flex-col items-center justify-center text-center p-8 space-y-4 hover:scale-[1.03] transition-all group">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444, #ec4899)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <span className="font-bold text-sm group-hover:text-white transition-colors">Alle Produkte</span>
            <span className="text-[11px] text-slate-400">Zum SkillR Merch Shop</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted, onLogin, onPartnerClick, onNavigate, onOpenCookieSettings }) => {
  const [activeStakeholder, setActiveStakeholder] = useState<Stakeholder>('kids');
  const [euBarDismissed, setEuBarDismissed] = useState(false);
  const [euBarHover, setEuBarHover] = useState(false);
  const [partners, setPartners] = useState<PartnerSummary[]>([]);

  useEffect(() => {
    fetchPartnerList().then(setPartners);
  }, []);
  const active = stakeholders.find((s) => s.key === activeStakeholder)!;
  const euBarVisible = !euBarDismissed || euBarHover;

  return (
    <div className="min-h-screen">
      {/* EU Co-Funding Notice — FR-112, DFR-006, DFR-007: dismissable */}
      <div
        className="fixed top-0 w-full z-50 transition-all duration-300 ease-in-out"
        onMouseEnter={() => euBarDismissed && setEuBarHover(true)}
        onMouseLeave={() => setEuBarHover(false)}
        style={{ height: euBarVisible ? undefined : '4px' }}
      >
        <div
          className={`bg-slate-900/80 backdrop-blur-sm border-b border-white/5 transition-all duration-300 ease-in-out overflow-hidden ${
            euBarVisible ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 relative">
            <img
              src="/icons/eu-co-funded-neg.png"
              alt="Kofinanziert von der Europaeischen Union"
              className="h-8 sm:h-10 w-auto"
            />
            <p className="text-[10px] sm:text-xs text-slate-400 text-center leading-snug max-w-2xl">
              Das Projekt wird im Rahmen des Programms &bdquo;Zukunftsplattform f&uuml;r soziale Innovationen und Modellvorhaben&ldquo; mit einer Zuwendung in H&ouml;he von 95&nbsp;% der zuwendungsf&auml;higen Ausgaben durch die Europ&auml;ische Union kofinanziert.
            </p>
            {!euBarDismissed && (
              <button
                onClick={() => setEuBarDismissed(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="EU-Hinweis ausblenden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav — DFR-006: below EU bar, shifts up when EU bar dismissed */}
      <nav className={`glass fixed w-full z-40 transition-all duration-300 ease-in-out ${euBarVisible ? 'top-[48px]' : 'top-0'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/app-icon.png" alt="SkillR" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-xl font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
              SkillR
            </span>
          </div>
          <button
            onClick={onLogin ?? onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-600/30"
          >
            Anmelden
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-36 sm:pt-32 px-4 overflow-hidden">
        {/* Orbs */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(80px)', top: '5rem', left: '-12rem', animation: 'pulse-glow 4s ease-in-out infinite' }}
        />
        <div
          className="absolute w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(168, 85, 247, 0.12)', filter: 'blur(80px)', bottom: '5rem', right: '2rem', animation: 'pulse-glow 4s ease-in-out 2s infinite' }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-wider">
            Das SkillR Universum
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight">
            Bist Du{' '}
            <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              ein SkillR?
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Keine Tests. Keine Noten. Keine Karriere-Empfehlungen.<br />
            Eine Reise, die zeigt, wer du wirklich bist — und ein ganzes Oekosystem,
            das dich dabei begleitet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all text-lg"
            >
              Reise starten
            </button>
            <a
              href="#universe"
              className="glass text-white font-semibold py-4 px-12 rounded-2xl hover:bg-white/10 transition-all text-lg inline-flex items-center justify-center"
            >
              Das Universum entdecken
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">So funktioniert&apos;s</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Von deinem ersten Interesse bis zu deinem fertigen Profil — in drei Schritten.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Kurzes Gespraech', desc: 'Unser KI-Coach lernt in 5 Minuten deine Interessen kennen.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="#38bdf8" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              )},
              { step: '02', title: 'Erlebnis-Stationen', desc: 'Tauche ein in interaktive Geschichten, Challenges und Lernuebungen.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="#a855f7" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              )},
              { step: '03', title: 'Dein Profil', desc: 'Sieh auf einen Blick, welche Staerken du entdeckt hast.', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="#f97316" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
              )},
            ].map((item) => (
              <div key={item.step} className="glass-light rounded-2xl p-6 space-y-3 text-center">
                <div className="flex justify-center mb-2">{item.icon}</div>
                <div className="text-xs font-mono text-slate-500">Schritt {item.step}</div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VUCA Dimensions */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Vier Dimensionen. Eine Reise.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Jede Dimension zeigt eine andere Seite von dir.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { letter: 'V', name: 'Volatilitaet', color: 'text-blue-400', desc: 'Wie gehst du mit Veraenderung um?' },
              { letter: 'U', name: 'Unsicherheit', color: 'text-purple-400', desc: 'Entscheidest du auch ohne alle Infos?' },
              { letter: 'C', name: 'Komplexitaet', color: 'text-orange-400', desc: 'Siehst du das grosse Bild im Chaos?' },
              { letter: 'A', name: 'Ambiguitaet', color: 'text-emerald-400', desc: 'Findest du Loesungen, wenn es kein Richtig gibt?' },
            ].map((d) => (
              <div key={d.letter} className="glass rounded-2xl p-5 sm:p-6 space-y-2 text-center hover:scale-105 transition-transform">
                <div className={`text-3xl sm:text-4xl font-extrabold ${d.color}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{d.letter}</div>
                <h3 className={`font-bold text-sm ${d.color}`}>{d.name}</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bildungspartner */}
      {partners.length > 0 && (
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-wider">
                PARTNER
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Unsere Bildungspartner</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Entdecke Lernreisen von unseren Partnern — echte Orte, echte Geschichten.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => (
                <button
                  key={partner.slug}
                  onClick={() => onPartnerClick?.(partner.slug)}
                  className="glass rounded-2xl p-6 space-y-4 hover:scale-[1.02] transition-transform cursor-pointer text-left"
                >
                  <div
                    className="h-1 rounded-full w-16"
                    style={{ backgroundColor: partner.theme.accentColor }}
                  />
                  <h3 className="text-lg font-bold text-white">{partner.brandName}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{partner.tagline}</p>
                  <div className="flex items-center justify-between pt-2">
                    {partner.lernreisenCount > 0 && (
                      <span
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${partner.theme.primaryColor}33`,
                          color: partner.theme.accentColor,
                        }}
                      >
                        {partner.lernreisenCount} Lernreise{partner.lernreisenCount !== 1 ? 'n' : ''}
                      </span>
                    )}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: partner.theme.accentColor }}
                    >
                      Erkunden &rarr;
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stakeholder Universe */}
      <section id="universe" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Das SkillR Universum</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Sechs Rollen. Ein gemeinsames Ziel: Jeder Jugendliche findet seinen Weg.
            </p>
          </div>

          {/* Stakeholder Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {stakeholders.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveStakeholder(s.key)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeStakeholder === s.key
                    ? `${s.color} glass border-white/20`
                    : 'text-slate-500 hover:text-slate-300 glass-light'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Active Stakeholder Detail */}
          <div
            className={`glass rounded-3xl p-6 sm:p-8 md:p-10 space-y-6 ${active.glowClass}`}
            style={getGlowStyle(active.key)}
          >
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${active.gradientClass}`}
                style={getGradientStyle(active.key)}
              >
                {active.icon}
              </div>
              <div className="space-y-2 flex-1">
                <span className={`text-xs font-mono tracking-wider ${active.color}`}>{active.role}</span>
                <h3 className="text-2xl font-bold">{active.label}</h3>
                <p className="text-slate-400 text-lg">{active.tagline}</p>
              </div>
            </div>

            <ul className="space-y-3">
              {active.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <svg className="mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  {b}
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <a
                href={`/landing/${active.key === 'kids' ? 'kids' : active.key === 'parents' ? 'parents' : active.key === 'companies' ? 'companies' : active.key === 'coaches' ? 'coaches' : active.key === 'ihk' ? 'ihk' : 'arbeitsagentur'}.html`}
                className={`inline-flex items-center gap-2 text-sm font-semibold ${active.color} hover:underline`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mehr erfahren
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Promise / Quote */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-8 sm:p-12 text-center space-y-6 glow-purple">
            <svg className="mx-auto" xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="#a855f7" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <blockquote className="text-2xl md:text-3xl font-bold leading-snug" style={{ fontFamily: "'Outfit', sans-serif" }}>
              &bdquo;Stimmt, das bin ich.&ldquo;
            </blockquote>
            <p className="text-slate-400 text-lg">
              Dieses Gefuehl bekommst du, wenn du dein Profil zum ersten Mal siehst.
              Nicht weil wir es ausgedacht haben — sondern weil du es entdeckt hast.
            </p>
          </div>
        </div>
      </section>

      {/* Merch Carousel */}
      <MerchCarousel />

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none left-1/2 -translate-x-1/2 top-0"
          style={{ background: 'rgba(168, 85, 247, 0.08)', filter: 'blur(80px)' }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold">Bereit fuer deine Reise?</h2>
          <p className="text-slate-400 text-lg">Es dauert 5 Minuten. Es kostet nichts. Und es koennte alles veraendern.</p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-16 rounded-2xl shadow-lg hover:shadow-blue-600/40 transition-all text-lg"
          >
            Jetzt starten — kostenlos
          </button>
          <p className="text-xs text-slate-500">Kein Abo. Keine versteckten Kosten. Einfach loslegen.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-light py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <img src="/icons/app-icon.png" alt="SkillR" className="w-8 h-8 rounded-lg shadow-lg" />
              <span>&copy; 2026 SkillR</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {stakeholders.map((s) => (
                <a
                  key={s.key}
                  href={`/landing/${s.key}.html`}
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {/* EU Co-Funding — FR-112, DFR-007: only show in footer when top bar is dismissed */}
          {euBarDismissed && (
            <div className="flex flex-col items-center gap-2 border-t border-white/5 pt-4">
              <img
                src="/icons/eu-co-funded-neg.png"
                alt="Kofinanziert von der Europaeischen Union"
                className="h-8 sm:h-10 w-auto"
              />
              <p className="text-[10px] sm:text-xs text-slate-500 text-center leading-snug max-w-2xl">
                Das Projekt wird im Rahmen des Programms &bdquo;Zukunftsplattform f&uuml;r soziale Innovationen und Modellvorhaben&ldquo; mit einer Zuwendung in H&ouml;he von 95&nbsp;% der zuwendungsf&auml;higen Ausgaben durch die Europ&auml;ische Union kofinanziert.
              </p>
            </div>
          )}
          {/* Compliance links — DSGVO / TMG */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-slate-500 border-t border-white/5 pt-4">
            <button onClick={() => onNavigate?.('impressum')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Impressum
            </button>
            <button onClick={() => onNavigate?.('datenschutz')} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Datenschutz
            </button>
            <button onClick={() => onOpenCookieSettings?.()} className="hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center">
              Cookie-Einstellungen
            </button>
          </div>
        </div>
      </footer>

      {/* Keyframe styles injected via style tag (needed for orb animations) */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
