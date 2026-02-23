import React, { useEffect, useState } from 'react';
import type { BrandConfig } from '../../types/brand';
import type { ContentPackMeta, PartnerData } from '../../types/partner';
import type { LernreiseDefinition } from '../../types/journey';
import { fetchPartnerData } from '../../services/partner';
import { getAuthHeaders } from '../../services/auth';

interface PartnerAdminPageProps {
  partnerSlug: string;
  onBack: () => void;
}

const Field: React.FC<{
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => (
  <div className="space-y-1">
    <label className="text-xs text-slate-400 font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
    />
  </div>
);

export const PartnerAdminPage: React.FC<PartnerAdminPageProps> = ({
  partnerSlug,
  onBack,
}) => {
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPartnerData(partnerSlug).then((result) => {
      if (cancelled) return;
      if (result) {
        setData(result);
        setBrand(result.brand);
      } else {
        setError(true);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [partnerSlug]);

  const handleSave = async () => {
    if (!brand) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`/api/brand/${encodeURIComponent(partnerSlug)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(brand),
      });
      if (res.ok) {
        setSaveMsg('Gespeichert');
      } else {
        setSaveMsg('Fehler beim Speichern');
      }
    } catch {
      setSaveMsg('Netzwerkfehler');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const previewUrl = `${window.location.origin}?partner=${partnerSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data || !brand) {
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
            Zurueck
          </button>
        </div>
      </div>
    );
  }

  const updateBrand = (partial: Partial<BrandConfig>) =>
    setBrand((prev) => (prev ? { ...prev, ...partial } : prev));

  const updateTheme = (key: 'primaryColor' | 'accentColor', value: string) =>
    setBrand((prev) =>
      prev ? { ...prev, theme: { ...prev.theme, [key]: value } } : prev,
    );

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-white/5 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{brand.brandName}</h1>
              <p className="text-xs text-slate-400">Partner-Verwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className="text-xs text-emerald-400">{saveMsg}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Brand Config Panel */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Marken-Konfiguration</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Markenname" value={brand.brandName} onChange={(v) => updateBrand({ brandName: v })} />
            <Field label="Kurzname" value={brand.brandNameShort} onChange={(v) => updateBrand({ brandNameShort: v })} />
            <Field label="Tagline" value={brand.tagline} onChange={(v) => updateBrand({ tagline: v })} />
            <Field label="Kontakt-E-Mail" value={brand.contactEmail} onChange={(v) => updateBrand({ contactEmail: v })} />
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Primaerfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.theme.primaryColor}
                  onChange={(e) => updateTheme('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <span className="text-sm text-slate-300 font-mono">{brand.theme.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Akzentfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.theme.accentColor}
                  onChange={(e) => updateTheme('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                />
                <span className="text-sm text-slate-300 font-mono">{brand.theme.accentColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Packs Panel */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Content Packs</h2>
          {data.packs.length === 0 ? (
            <p className="text-slate-400 text-sm">Keine Content Packs verknuepft.</p>
          ) : (
            <div className="space-y-4">
              {data.packs.map((pack: ContentPackMeta) => (
                <div key={pack.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-white">{pack.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Aktiv
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{pack.description}</p>
                  <div className="text-xs text-slate-500">
                    {data.lernreisen
                      .filter((lr: LernreiseDefinition) =>
                        pack.id === '003'
                          ? ['lr-kosmonautentraining', 'lr-gagarins-spuren', 'lr-mission-mars'].includes(lr.id)
                          : true,
                      )
                      .map((lr: LernreiseDefinition) => (
                        <span key={lr.id} className="inline-flex items-center gap-1 mr-3">
                          {lr.icon} {lr.title}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preview Link */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Partner-Vorschau</h2>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={previewUrl}
              className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors shrink-0"
            >
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Teile diesen Link, um die Partner-Vorschauseite zu zeigen.
          </p>
        </section>
      </div>
    </div>
  );
};
