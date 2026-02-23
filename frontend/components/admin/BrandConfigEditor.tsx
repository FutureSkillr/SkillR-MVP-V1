import React, { useEffect, useState } from 'react';
import type { BrandConfig } from '../../types/brand';
import { DEFAULT_BRAND } from '../../constants/defaultBrand';
import { getAuthHeaders } from '../../services/auth';
import { fetchBrandContentPacks, toggleBrandContentPack, type BrandContentPack } from '../../services/contentPack';
import { SSI_BRAND } from '../../constants/partners/spaceServiceIntl';
import { CZ_BRAND } from '../../constants/partners/carlsZukunft';
import { MA_BRAND } from '../../constants/partners/maindsetAcademy';

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
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dbWarning, setDbWarning] = useState<string | null>(null);

  const headers = getAuthHeaders();

  async function loadBrands() {
    let dbBrands: BrandListItem[] = [];
    try {
      const res = await fetch('/api/brand', { headers });
      if (res.ok) {
        dbBrands = await res.json();
        setDbWarning(null);
      } else {
        setDbWarning('Brand-Liste konnte nicht vom Server geladen werden — lokale Konfigurationen werden angezeigt.');
      }
    } catch {
      setDbWarning('Brand-Liste konnte nicht vom Server geladen werden — lokale Konfigurationen werden angezeigt.');
    }

    // Merge hardcoded partners not yet in the database
    const dbSlugs = new Set(dbBrands.map((b) => b.slug));
    const hardcoded: BrandConfig[] = [SSI_BRAND, CZ_BRAND, MA_BRAND];
    const extras: BrandListItem[] = hardcoded
      .filter((h) => h.slug && !dbSlugs.has(h.slug))
      .map((h) => ({
        ...h,
        isActive: true,
        createdAt: 0,
        updatedAt: 0,
      }));

    setBrands([...dbBrands, ...extras]);
  }

  useEffect(() => { loadBrands(); }, []);

  function startCreate() {
    setEditing(emptyBrand());
    setIsNew(true);
    setIsOnboarding(false);
    setError(null);
    setSuccess(null);
  }

  function startEdit(brand: BrandListItem) {
    // Hardcoded-only brands (not yet in DB) need onboarding (POST), not update (PUT)
    const notInDb = brand.createdAt === 0;
    setEditing({ ...brand });
    setIsNew(notInDb);
    setIsOnboarding(notInDb);
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
          // OBS-001: If onboarding a hardcoded brand that already exists in DB, fall back to PUT
          if (isOnboarding && res.status === 409) {
            const putRes = await fetch(`/api/brand/${slug}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(config),
            });
            if (!putRes.ok) {
              const putData = await putRes.json();
              throw new Error(putData.error || 'Fehler beim Speichern');
            }
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Fehler beim Erstellen');
          }
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
      setSuccess(isOnboarding ? 'Brand in Datenbank gespeichert!' : isNew ? 'Brand erstellt!' : 'Brand gespeichert!');
      // OBS-002: Optimistic update — mark brand as persisted so "Nur lokal" disappears immediately
      if (isOnboarding && slug) {
        setBrands((prev) =>
          prev.map((b) =>
            b.slug === slug ? { ...b, createdAt: Date.now(), updatedAt: Date.now() } : b,
          ),
        );
      }
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
            {isOnboarding
              ? `Brand onboarden: ${editing.slug}`
              : isNew
                ? 'Neue Partner-Brand'
                : `Brand bearbeiten: ${editing.slug}`}
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
            disabled={!isNew || isOnboarding}
            hint={isOnboarding ? 'Slug ist durch die lokale Konfiguration festgelegt' : 'Wird zur Subdomain: {slug}.maindset.academy'}
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

        {/* Content Packs (FR-119) — show for existing brands and onboarding brands (packs already in DB) */}
        {(!isNew || isOnboarding) && editing.slug && (
          <ContentPackToggle brandSlug={editing.slug} />
        )}

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
          {saving
            ? 'Speichern...'
            : isOnboarding
              ? 'In Datenbank speichern'
              : isNew
                ? 'Brand erstellen'
                : 'Aenderungen speichern'}
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

      {dbWarning && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-400 text-xs">
          {dbWarning}
        </div>
      )}

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
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {b.brandName || b.slug}
                    {b.createdAt === 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-normal">
                        Nur lokal
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {b.slug}.maindset.academy
                    {!b.isActive && <span className="text-red-400 ml-2">(deaktiviert)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {b.isActive && (
                  <a
                    href={`?partner=${b.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px] px-2 flex items-center gap-1"
                  >
                    Partner-Seite
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
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

// Content Pack toggle section for a brand (FR-119)
const ContentPackToggle: React.FC<{ brandSlug: string }> = ({ brandSlug }) => {
  const [packs, setPacks] = useState<BrandContentPack[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandContentPacks(brandSlug).then(setPacks);
  }, [brandSlug]);

  async function handleToggle(packId: string, active: boolean) {
    setToggling(packId);
    const ok = await toggleBrandContentPack(brandSlug, packId, active);
    if (ok) {
      setPacks((prev) =>
        prev.map((p) => (p.id === packId ? { ...p, brandActive: active } : p)),
      );
    }
    setToggling(null);
  }

  if (packs.length === 0) return null;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-bold text-slate-300">Content Packs</legend>
      <p className="text-[10px] text-slate-500">
        Aktiviere oder deaktiviere Lernreise-Pakete fuer diese Partner-Brand.
        Pakete mit &quot;Standard&quot; sind fuer alle Nutzer sichtbar.
      </p>
      <div className="space-y-2">
        {packs.map((p) => (
          <div
            key={p.id}
            className="glass rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{p.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                  Pack {p.id}
                </span>
                {p.defaultEnabled && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    Standard
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{p.description}</p>
              {p.sponsor && (
                <p className="text-[10px] text-amber-400/70 mt-0.5">Sponsor: {p.sponsor}</p>
              )}
            </div>
            <button
              onClick={() => handleToggle(p.id, !p.brandActive)}
              disabled={toggling === p.id}
              className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${
                p.brandActive
                  ? 'bg-emerald-500/30 border border-emerald-500/50'
                  : 'bg-slate-700/50 border border-white/10'
              } ${toggling === p.id ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                  p.brandActive
                    ? 'left-6 bg-emerald-400'
                    : 'left-1 bg-slate-500'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </fieldset>
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
