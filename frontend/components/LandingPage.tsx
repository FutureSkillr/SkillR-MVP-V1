import React, { useState, useEffect } from 'react';
import { getJourneysAsDefinitions, getStationCountPerJourney } from '../services/contentResolver';
import { fetchPartnerList } from '../services/partner';
import type { JourneyType } from '../types/journey';
import type { JourneyProgress } from '../types/user';
import type { PartnerSummary } from '../types/partner';

interface LandingPageProps {
  onStart: () => void;
  onSelectJourney: (journey: JourneyType) => void;
  onViewProfile?: () => void;
  onPartnerClick?: (slug: string) => void;
  journeyProgress?: Record<JourneyType, JourneyProgress>;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSelectJourney, onViewProfile, onPartnerClick, journeyProgress }) => {
  const journeyList = Object.values(getJourneysAsDefinitions());
  const stationCounts = getStationCountPerJourney();
  const [partners, setPartners] = useState<PartnerSummary[]>([]);

  useEffect(() => {
    fetchPartnerList().then(setPartners);
  }, []);

  const hasAnyProgress = journeyProgress && Object.values(journeyProgress).some(
    (p) => p.stationsCompleted > 0
  );

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
          Beta &mdash; Deine Reise beginnt hier
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Bist Du{' '}
          <span className="gradient-text animate-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            ein SkillR?
          </span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Keine Tests. Keine Noten. Drei einzigartige Erlebnis-Reisen, die
          zeigen, was in dir steckt.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all text-lg"
          >
            Reise starten
          </button>
          {hasAnyProgress && onViewProfile && (
            <button
              onClick={onViewProfile}
              className="glass text-white font-semibold py-4 px-12 rounded-2xl hover:bg-white/10 transition-all text-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Mein Profil
            </button>
          )}
        </div>
      </section>

      {/* Journey Preview Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Drei Wege, dich zu entdecken</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {journeyList.map((journey) => (
            <button
              key={journey.type}
              onClick={() => onSelectJourney(journey.type)}
              className={`glass rounded-2xl p-6 space-y-4 hover:scale-[1.02] transition-transform cursor-pointer text-left ${journey.glowClass}`}
            >
              <div
                className={`w-14 h-14 ${journey.gradientClass} rounded-xl flex items-center justify-center text-2xl shadow-lg`}
              >
                {journey.icon}
              </div>
              <h3 className={`text-xl font-bold ${journey.colorClass}`}>
                {journey.title}
              </h3>
              <p className="text-sm text-slate-400">{journey.subtitle}</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {journey.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {journey.dimensions.slice(0, 3).map((dim) => (
                  <span
                    key={dim.key}
                    className={`text-[10px] px-2 py-1 rounded-full ${journey.bgClass} ${journey.colorClass} font-medium`}
                  >
                    {dim.experienceLabel}
                  </span>
                ))}
                {journey.dimensions.length > 3 && (
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full ${journey.bgClass} ${journey.colorClass} font-medium`}
                  >
                    +{journey.dimensions.length - 3}
                  </span>
                )}
              </div>
              {/* Progress indicator */}
              {(() => {
                const progress = journeyProgress?.[journey.type];
                const totalStations = stationCounts[journey.type] || 1;
                const completed = progress?.stationsCompleted ?? 0;

                if (!progress?.started) {
                  return (
                    <div className="pt-2 text-xs text-slate-500">
                      Noch nicht gestartet
                    </div>
                  );
                }

                if (completed >= totalStations) {
                  return (
                    <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Abgeschlossen
                    </div>
                  );
                }

                const pct = Math.round((completed / totalStations) * 100);
                return (
                  <div className="pt-2 space-y-1.5">
                    <div className="text-xs text-slate-400">
                      {completed} / {totalStations} Stationen
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${journey.gradientClass} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center">So funktioniert&apos;s</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Kurzes Gespraech',
              desc: 'Unser KI-Coach lernt in 5 Minuten deine Interessen kennen.',
              icon: '💬',
            },
            {
              step: '02',
              title: 'Erlebnis-Station',
              desc: 'Tauche ein in eine interaktive Geschichte, Challenge oder Lernuebung.',
              icon: '🎮',
            },
            {
              step: '03',
              title: 'Dein Profil',
              desc: 'Sieh auf einen Blick, welche Staerken du entdeckt hast.',
              icon: '📊',
            },
          ].map((item) => (
            <div key={item.step} className="glass-light rounded-2xl p-6 space-y-3 text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-xs font-mono text-slate-500">
                Schritt {item.step}
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners Section */}
      {partners.length > 0 && (
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Unsere Bildungspartner</h2>
            <p className="text-slate-400 text-sm">Entdecke Lernreisen von unseren Partnern</p>
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
        </section>
      )}

      {/* Bottom CTA */}
      <section className="text-center py-8">
        <button
          onClick={onStart}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all text-lg"
        >
          Jetzt starten — kostenlos
        </button>
        <p className="text-xs text-slate-500 mt-3">
          Keine Creditkarte nötig. Die App ist kostenfrei!
        </p>
      </section>
    </div>
  );
};
