import React, { useEffect, useState } from 'react';
import type { BrandConfig } from '../../types/brand';
import { DEFAULT_BRAND } from '../../constants/defaultBrand';
import { getAuthHeaders } from '../../services/auth';

interface BrandListItem extends BrandConfig {
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

function emptyBrand(): BrandConfig {
  return {
    ...DEFAULT_BRAND,
    slug: '',
    brandName: '',
    brandNameShort: '',
    tagline: '',
    universeTitle: '',
    contactEmail: '',
    copyrightHolder: '',
    logoUrl: '/icons/app-icon.png',
    appIconUrl: '/icons/app-icon.png',
    pageTitle: '',
    metaDescription: '',
    theme: { primaryColor: '#3b82f6', accentColor: '#a855f7' },
    legal: { ...DEFAULT_BRAND.legal },
    aiCoachBrandName: '',
    sponsorLabel: null,
  };
}

function getContrastRatio(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Background is #0f172a (very dark)
  const bgLum = (0.299 * 15 + 0.587 * 23 + 0.114 * 42) / 255;
  const ratio = (Math.max(luminance, bgLum) + 0.05) / (Math.min(luminance, bgLum) + 0.05);
  return ratio.toFixed(1);
}

export const BrandConfigEditor: React.FC = () => {
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [editing, setEditing] = useState<BrandConfig | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const headers = getAuthHeaders();

  async function loadBrands() {
    try {
      const res = await fetch('/api/brand', { headers });
      if (res.ok) setBrands(await res.json());
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBrands(); }, []);

  function startCreate() {
    setEditing(emptyBrand());
    setIsNew(true);
    setError(null);
    setSuccess(null);
  }

  function startEdit(brand: BrandListItem) {
    setEditing({ ...brand });
    setIsNew(false);
    setError(null);
    setSuccess(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { slug, ...config } = editing;
      if (isNew) {
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
          throw new Error('Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
        }
        const res = await fetch('/api/brand', {
          method: 'POST',
          headers,
          body: JSON.stringify({ slug, ...config }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Fehler beim Erstellen');
        }
      } else {
        const res = await fetch(`/api/brand/${slug}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(config),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Fehler beim Speichern');
        }
      }
      setSuccess(isNew ? 'Brand erstellt!' : 'Brand gespeichert!');
      setEditing(null);
      loadBrands();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(slug: string) {
    if (!confirm(`Brand "${slug}" wirklich deaktivieren?`)) return;
    try {
      await fetch(`/api/brand/${slug}`, { method: 'DELETE', headers });
      loadBrands();
    } catch { /* ignore */ }
  }

  function updateField(path: string, value: string | null) {
    if (!editing) return;
    const updated = { ...editing };
    if (path.startsWith('legal.')) {
      const key = path.replace('legal.', '') as keyof BrandConfig['legal'];
      updated.legal = { ...updated.legal, [key]: value || '' };
    } else if (path.startsWith('theme.')) {
      const key = path.replace('theme.', '') as keyof BrandConfig['theme'];
      updated.theme = { ...updated.theme, [key]: value || '' };
    } else {
      (updated as any)[path] = value;
    }
    setEditing(updated);
  }

  // Editor form
  if (editing) {
    const primaryContrast = getContrastRatio(editing.theme.primaryColor || '#3b82f6');
    const accentContrast = getContrastRatio(editing.theme.accentColor || '#a855f7');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {isNew ? 'Neue Partner-Brand' : `Brand bearbeiten: ${editing.slug}`}
          </h3>
          <button
            onClick={() => setEditing(null)}
            className="text-xs text-slate-400 hover:text-white transition-colors min-h-[44px] px-3"
          >
            Abbrechen
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Identity */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Identitaet</legend>
          <Field
            label="Slug"
            value={editing.slug || ''}
            onChange={(v) => updateField('slug', v)}
            placeholder="ihk-muenchen"
            disabled={!isNew}
            hint="Wird zur Subdomain: {slug}.maindset.academy"
          />
          <Field label="Brand Name" value={editing.brandName} onChange={(v) => updateField('brandName', v)} placeholder="IHK Muenchen" />
          <Field label="Kurzname" value={editing.brandNameShort} onChange={(v) => updateField('brandNameShort', v)} placeholder="IHK" />
          <Field label="Tagline" value={editing.tagline} onChange={(v) => updateField('tagline', v)} placeholder="Bist Du ein SkillR?" hint="Max. 60 Zeichen" />
          <Field label="Universum-Titel" value={editing.universeTitle} onChange={(v) => updateField('universeTitle', v)} placeholder="Das SkillR Universum" />
          <Field label="AI Coach Brand Name" value={editing.aiCoachBrandName} onChange={(v) => updateField('aiCoachBrandName', v)} placeholder="Future SkillR" hint="Wird in KI-Systemprompts injiziert" />
          <Field label="Sponsor-Label" value={editing.sponsorLabel || ''} onChange={(v) => updateField('sponsorLabel', v || null)} placeholder='z.B. "Supported by IHK Muenchen"' hint="Wird im Footer angezeigt (leer = kein Label)" />
        </fieldset>

        {/* Visual */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Visuell</legend>
          <Field label="Logo URL" value={editing.logoUrl} onChange={(v) => updateField('logoUrl', v)} placeholder="/icons/app-icon.png" />
          <Field label="App Icon URL" value={editing.appIconUrl} onChange={(v) => updateField('appIconUrl', v)} placeholder="/icons/app-icon.png" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Primaerfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.theme.primaryColor}
                  onChange={(e) => updateField('theme.primaryColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={editing.theme.primaryColor}
                  onChange={(e) => updateField('theme.primaryColor', e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <span className={`text-[10px] ${parseFloat(primaryContrast) >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Kontrast: {primaryContrast}:1 {parseFloat(primaryContrast) >= 4.5 ? '(WCAG AA)' : '(zu niedrig!)'}
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Akzentfarbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.theme.accentColor}
                  onChange={(e) => updateField('theme.accentColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={editing.theme.accentColor}
                  onChange={(e) => updateField('theme.accentColor', e.target.value)}
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <span className={`text-[10px] ${parseFloat(accentContrast) >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Kontrast: {accentContrast}:1 {parseFloat(accentContrast) >= 4.5 ? '(WCAG AA)' : '(zu niedrig!)'}
              </span>
            </div>
          </div>
        </fieldset>

        {/* Contact */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Kontakt</legend>
          <Field label="Kontakt-E-Mail" value={editing.contactEmail} onChange={(v) => updateField('contactEmail', v)} placeholder="info@partner.de" />
          <Field label="Copyright-Inhaber" value={editing.copyrightHolder} onChange={(v) => updateField('copyrightHolder', v)} placeholder="Future SkillR" />
        </fieldset>

        {/* Page Meta */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Seiten-Meta</legend>
          <Field label="Seitentitel" value={editing.pageTitle} onChange={(v) => updateField('pageTitle', v)} placeholder="Future SkillR - Bist Du ein SkillR?" />
          <Field label="Meta-Beschreibung" value={editing.metaDescription} onChange={(v) => updateField('metaDescription', v)} placeholder="Entdecke deine Skills..." />
        </fieldset>

        {/* Legal */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Rechtliches (Impressum)</legend>
          <Field label="Firmenname" value={editing.legal.companyName} onChange={(v) => updateField('legal.companyName', v)} />
          <Field label="Adresse" value={editing.legal.companyAddress} onChange={(v) => updateField('legal.companyAddress', v)} />
          <Field label="Land" value={editing.legal.companyCountry} onChange={(v) => updateField('legal.companyCountry', v)} placeholder="Deutschland" />
          <Field label="E-Mail (rechtlich)" value={editing.legal.contactEmail} onChange={(v) => updateField('legal.contactEmail', v)} />
          <Field label="Telefon" value={editing.legal.contactPhone} onChange={(v) => updateField('legal.contactPhone', v)} />
          <Field label="Vertretungsberechtigte Person" value={editing.legal.legalRepresentative} onChange={(v) => updateField('legal.legalRepresentative', v)} />
          <Field label="Registereintrag" value={editing.legal.registerEntry} onChange={(v) => updateField('legal.registerEntry', v)} />
          <Field label="USt-ID" value={editing.legal.vatId} onChange={(v) => updateField('legal.vatId', v)} />
          <Field label="Inhaltlich Verantwortlicher" value={editing.legal.contentResponsible} onChange={(v) => updateField('legal.contentResponsible', v)} />
        </fieldset>

        {/* Preview */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Vorschau</legend>
          <div className="glass rounded-xl p-6 text-center space-y-3">
            {editing.appIconUrl && (
              <img src={editing.appIconUrl} alt="" className="w-16 h-16 rounded-xl mx-auto" />
            )}
            <h3 className="text-xl font-bold" style={{ color: editing.theme.primaryColor }}>
              {editing.brandName || 'Brand Name'}
            </h3>
            <p className="text-sm text-slate-400">
              {editing.tagline || 'Tagline'}
            </p>
            {editing.sponsorLabel && (
              <p className="text-xs text-slate-500">{editing.sponsorLabel}</p>
            )}
          </div>
        </fieldset>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all min-h-[48px]"
        >
          {saving ? 'Speichern...' : isNew ? 'Brand erstellen' : 'Aenderungen speichern'}
        </button>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Partner-Brands</h3>
          <p className="text-xs text-slate-500">
            Verwalte gebrandete Showrooms fuer Partner ({brands.length} konfiguriert)
          </p>
        </div>
        <button
          onClick={startCreate}
          className="text-xs px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium min-h-[44px] flex items-center"
        >
          + Neue Brand
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {brands.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <p className="text-slate-400 text-sm">Noch keine Partner-Brands konfiguriert.</p>
          <p className="text-slate-500 text-xs">
            Erstelle eine Brand, damit Partner unter{' '}
            <code className="text-blue-400">slug.maindset.academy</code> ihre eigene Version sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {brands.map((b) => (
            <div
              key={b.slug}
              className={`glass rounded-xl p-4 flex items-center justify-between gap-4 ${
                !b.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow shrink-0"
                  style={{ background: `linear-gradient(135deg, ${b.theme?.primaryColor || '#3b82f6'}, ${b.theme?.accentColor || '#a855f7'})` }}
                >
                  {(b.brandNameShort || 'B')[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{b.brandName || b.slug}</div>
                  <div className="text-[10px] text-slate-500">
                    {b.slug}.maindset.academy
                    {!b.isActive && <span className="text-red-400 ml-2">(deaktiviert)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(b)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] px-2"
                >
                  Bearbeiten
                </button>
                {b.isActive && (
                  <button
                    onClick={() => handleDeactivate(b.slug!)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors min-h-[44px] px-2"
                  >
                    Deaktivieren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Reusable text field
const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}> = ({ label, value, onChange, placeholder, disabled, hint }) => (
  <div className="space-y-1">
    <label className="text-xs text-slate-400 font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
    />
    {hint && <p className="text-[10px] text-slate-600">{hint}</p>}
  </div>
);
