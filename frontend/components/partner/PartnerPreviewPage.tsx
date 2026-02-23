import React, { useEffect, useState } from 'react';
import type { PartnerData } from '../../types/partner';
import type { LernreiseDefinition } from '../../types/journey';
import { fetchPartnerData } from '../../services/partner';
import {
  SSI_PARTNER_DESCRIPTION,
  SSI_KEY_FACTS,
} from '../../constants/partners/spaceServiceIntl';

interface PartnerPreviewPageProps {
  partnerSlug: string;
  onBack: () => void;
  onStartJourney: (slug: string) => void;
}

const JOURNEY_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  vuca: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'VUCA' },
  entrepreneur: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Unternehmergeist' },
  'self-learning': { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Selbstlernen' },
};

function LernreiseCard({ lr, primaryColor, accentColor }: { lr: LernreiseDefinition; primaryColor: string; accentColor: string }) {
  const jt = JOURNEY_TYPE_COLORS[lr.journeyType] || JOURNEY_TYPE_COLORS.vuca;
  return (
    <div
      className="glass rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-default group"
      style={{ borderColor: `${accentColor}30` }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
        >
          {lr.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white group-hover:text-slate-100 transition-colors">
            {lr.title}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">{lr.subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-slate-300 mt-3 leading-relaxed line-clamp-3">{lr.description}</p>
      <div className="flex items-center gap-3 mt-4">
        <span className={`text-xs px-2.5 py-1 rounded-full ${jt.bg} ${jt.text} font-medium`}>
          {jt.label}
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {lr.location}
        </span>
      </div>
    </div>
  );
}

export const PartnerPreviewPage: React.FC<PartnerPreviewPageProps> = ({
  partnerSlug,
  onBack,
  onStartJourney,
}) => {
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchPartnerData(partnerSlug).then((result) => {
      if (cancelled) return;
      if (result) {
        setData(result);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [partnerSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <h1 className="text-2xl font-bold text-white">Partner nicht gefunden</h1>
          <p className="text-slate-400">
            Der Partner <code className="text-slate-300">"{partnerSlug}"</code> existiert nicht.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2.5 rounded-xl glass text-sm text-slate-300 hover:text-white transition-colors"
          >
            Zurueck zu SkillR
          </button>
        </div>
      </div>
    );
  }

  const { brand, packs, lernreisen } = data;
  const primary = brand.theme.primaryColor;
  const accent = brand.theme.accentColor;

  // Use SSI-specific description/facts when available, generic fallback otherwise
  const isSSI = partnerSlug === 'space-service-intl';
  const description = isSSI ? SSI_PARTNER_DESCRIPTION : brand.metaDescription;
  const keyFacts = isSSI ? SSI_KEY_FACTS : [];

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 40%, ${accent}40 100%)`,
        }}
      >
        {/* Starfield decoration */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurueck zu SkillR
          </button>

          {/* Partner badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{ background: `${accent}30`, color: accent }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            SkillR Bildungspartner
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            {brand.brandName}
          </h1>
          <p className="text-xl text-white/80 max-w-2xl">{brand.tagline}</p>
        </div>
      </section>

      {/* Partner Info Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Ueber den Partner</h2>
          <p className="text-slate-300 leading-relaxed">{description}</p>

          {keyFacts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {keyFacts.map((fact) => (
                <div key={fact.label} className="text-center">
                  <div className="text-2xl font-bold" style={{ color: accent }}>
                    {fact.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{fact.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lernreisen Showcase */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-2">Lernreisen</h2>
        <p className="text-slate-400 mb-8">
          {lernreisen.length} Lernreise{lernreisen.length !== 1 ? 'n' : ''} von{' '}
          {brand.brandNameShort || brand.brandName}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lernreisen.map((lr) => (
            <LernreiseCard
              key={lr.id}
              lr={lr}
              primaryColor={primary}
              accentColor={accent}
            />
          ))}
        </div>
      </section>

      {/* Content Pack Info */}
      {packs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div
            className="rounded-2xl p-8"
            style={{ background: `${primary}30`, border: `1px solid ${accent}20` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: `${accent}30` }}
              >
                📦
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{packs[0].name}</h3>
                <p className="text-xs text-slate-400">Content Pack</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{packs[0].description}</p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-4">Bereit fuer das Abenteuer?</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Starte deine Lernreise mit Inhalten von {brand.brandNameShort || brand.brandName} auf
            SkillR.
          </p>
          <button
            onClick={() => onStartJourney(partnerSlug)}
            className="px-8 py-4 rounded-2xl text-lg font-bold text-white shadow-lg hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${accent})`,
              boxShadow: `0 0 40px ${accent}40`,
            }}
          >
            Reise starten
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            {brand.legal.companyName && (
              <span>
                {brand.legal.companyName}{brand.legal.companyAddress ? ` · ${brand.legal.companyAddress}` : ''}
              </span>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            Zurueck zu SkillR
          </button>
        </div>
      </footer>
    </div>
  );
};
