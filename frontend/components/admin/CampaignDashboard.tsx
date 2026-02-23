import React, { useEffect, useState } from 'react';
import type { Campaign, CampaignStats } from '../../types/campaign';
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
} from '../../services/campaigns';

type Mode = 'list' | 'edit' | 'stats';

const PLATFORM_OPTIONS: Campaign['platform'][] = ['meta', 'google', 'tiktok', 'other'];
const STATUS_OPTIONS: Campaign['status'][] = ['draft', 'active', 'paused', 'completed', 'archived'];

const STATUS_COLORS: Record<Campaign['status'], string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-blue-500/20 text-blue-400',
  archived: 'bg-red-500/20 text-red-400',
};

const PLATFORM_LABELS: Record<Campaign['platform'], string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  other: 'Sonstige',
};

function emptyCampaign(): Partial<Campaign> {
  return {
    name: '',
    platform: 'meta',
    utm_source: 'meta',
    utm_medium: 'paid',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    meta_pixel_id: '',
    budget_cents: undefined,
    currency: 'EUR',
    start_date: '',
    end_date: '',
    status: 'draft',
    notes: '',
  };
}

function buildCampaignUrl(c: Partial<Campaign>): string {
  const base = 'https://skillr.app';
  const params = new URLSearchParams();
  if (c.utm_source) params.set('utm_source', c.utm_source);
  if (c.utm_medium) params.set('utm_medium', c.utm_medium);
  if (c.utm_campaign) params.set('utm_campaign', c.utm_campaign);
  if (c.utm_content) params.set('utm_content', c.utm_content);
  if (c.utm_term) params.set('utm_term', c.utm_term);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export const CampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [statsFor, setStatsFor] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const data = await listCampaigns();
      setCampaigns(data);
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(emptyCampaign());
    setEditingId(null);
    setMode('edit');
    setError(null);
    setSuccess(null);
  }

  function startEdit(c: Campaign) {
    setEditing({ ...c });
    setEditingId(c.id);
    setMode('edit');
    setError(null);
    setSuccess(null);
  }

  async function showStats(c: Campaign) {
    setStatsFor(c);
    setMode('stats');
    setError(null);
    try {
      const data = await getCampaignStats(c.id);
      setStats(data);
    } catch {
      setError('Statistiken konnten nicht geladen werden.');
    }
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Apply placeholder defaults for empty fields
      const defaults: Record<string, string> = {
        name: 'Fruehjahrs-Kampagne 2026',
        utm_source: 'meta',
        utm_medium: 'paid',
        utm_campaign: 'fruehjahr-2026',
        utm_content: 'video-ad-1',
        utm_term: 'berufsorientierung',
        start_date: '2026-03-01',
        end_date: '2026-03-31',
      };
      const data = { ...editing };
      for (const [key, fallback] of Object.entries(defaults)) {
        if (!data[key as keyof typeof data]) {
          (data as Record<string, unknown>)[key] = fallback;
        }
      }

      if (editingId) {
        await updateCampaign(editingId, data);
        setSuccess('Kampagne gespeichert!');
      } else {
        await createCampaign(data);
        setSuccess('Kampagne erstellt!');
      }
      setEditing(null);
      setEditingId(null);
      setMode('list');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm('Kampagne wirklich archivieren?')) return;
    try {
      await deleteCampaign(id);
      load();
    } catch { /* ignore */ }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // --- Stats view ---
  if (mode === 'stats' && statsFor) {
    const url = buildCampaignUrl(statsFor);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{statsFor.name} — Statistiken</h3>
          <button
            onClick={() => { setMode('list'); setStats(null); setStatsFor(null); }}
            className="text-xs text-slate-400 hover:text-white transition-colors min-h-[44px] px-3"
          >
            Zurueck
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Campaign URL */}
        <div className="glass rounded-xl p-4 space-y-2">
          <label className="text-xs text-slate-400 font-medium">Kampagnen-URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-blue-400 bg-slate-800/50 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap">
              {url}
            </code>
            <button
              onClick={() => copyUrl(url)}
              className="text-xs px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors whitespace-nowrap min-h-[44px]"
            >
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
          </div>
        </div>

        {stats ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Besucher" value={String(stats.visitors)} />
              <KpiCard label="Registrierungen" value={String(stats.registrations)} />
              <KpiCard label="Kosten/Besucher" value={stats.costPerVisitor ? `${stats.costPerVisitor} ${statsFor.currency}` : '—'} />
              <KpiCard label="Kosten/Registrierung" value={stats.costPerRegistration ? `${stats.costPerRegistration} ${statsFor.currency}` : '—'} />
            </div>

            {/* Funnel */}
            {stats.funnel.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-300">Conversion Funnel</h4>
                <div className="space-y-2">
                  {stats.funnel.map((step) => {
                    const maxCount = Math.max(...stats.funnel.map((s) => s.count), 1);
                    const pct = (step.count / maxCount) * 100;
                    return (
                      <div key={step.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{step.label}</span>
                          <span className="text-white font-medium">{step.count}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : !error ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">Lade Statistiken...</p>
          </div>
        ) : null}
      </div>
    );
  }

  // --- Edit / Create view ---
  if (mode === 'edit' && editing) {
    const url = buildCampaignUrl(editing);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {editingId ? 'Kampagne bearbeiten' : 'Neue Kampagne'}
          </h3>
          <button
            onClick={() => { setMode('list'); setEditing(null); setEditingId(null); }}
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

        {/* Basic info */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Grunddaten</legend>
          <Field label="Name" value={editing.name || ''} onChange={(v) => setEditing({ ...editing, name: v })} placeholder="Fruehjahrs-Kampagne 2026" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Plattform"
              value={editing.platform || 'meta'}
              options={PLATFORM_OPTIONS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
              onChange={(v) => setEditing({ ...editing, platform: v as Campaign['platform'] })}
            />
            <SelectField
              label="Status"
              value={editing.status || 'draft'}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              onChange={(v) => setEditing({ ...editing, status: v as Campaign['status'] })}
            />
          </div>
        </fieldset>

        {/* UTM Parameters */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">UTM-Parameter</legend>
          <Field label="utm_source" value={editing.utm_source || ''} onChange={(v) => setEditing({ ...editing, utm_source: v })} placeholder="meta" />
          <Field label="utm_medium" value={editing.utm_medium || ''} onChange={(v) => setEditing({ ...editing, utm_medium: v })} placeholder="paid" />
          <Field label="utm_campaign" value={editing.utm_campaign || ''} onChange={(v) => setEditing({ ...editing, utm_campaign: v })} placeholder="fruehjahr-2026" />
          <Field label="utm_content" value={editing.utm_content || ''} onChange={(v) => setEditing({ ...editing, utm_content: v })} placeholder="video-ad-1" />
          <Field label="utm_term" value={editing.utm_term || ''} onChange={(v) => setEditing({ ...editing, utm_term: v })} placeholder="berufsorientierung" />
        </fieldset>

        {/* Campaign URL preview */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Kampagnen-URL</legend>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-blue-400 bg-slate-800/50 rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap">
              {url}
            </code>
            <button
              onClick={() => copyUrl(url)}
              className="text-xs px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors whitespace-nowrap min-h-[44px]"
            >
              {copied ? 'Kopiert!' : 'Kopieren'}
            </button>
          </div>
        </fieldset>

        {/* Budget & dates */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Budget & Zeitraum</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Budget (EUR)"
              value={editing.budget_cents != null ? String(editing.budget_cents / 100) : ''}
              onChange={(v) => {
                const cents = v ? Math.round(parseFloat(v) * 100) : undefined;
                setEditing({ ...editing, budget_cents: cents });
              }}
              placeholder="500.00"
            />
            <Field label="Meta Pixel ID" value={editing.meta_pixel_id || ''} onChange={(v) => setEditing({ ...editing, meta_pixel_id: v })} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" value={editing.start_date || ''} onChange={(v) => setEditing({ ...editing, start_date: v })} placeholder="2026-03-01" />
            <Field label="Ende" value={editing.end_date || ''} onChange={(v) => setEditing({ ...editing, end_date: v })} placeholder="2026-03-31" />
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Notizen</legend>
          <textarea
            value={editing.notes || ''}
            onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            placeholder="Interne Notizen zur Kampagne..."
            rows={3}
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
          />
        </fieldset>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all min-h-[48px]"
        >
          {saving ? 'Speichern...' : editingId ? 'Aenderungen speichern' : 'Kampagne erstellen'}
        </button>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Kampagnen</h3>
          <p className="text-xs text-slate-500">
            Verwalte Ad-Kampagnen und verfolge Conversions ({campaigns.length} Kampagnen)
          </p>
        </div>
        <button
          onClick={startCreate}
          className="text-xs px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium min-h-[44px] flex items-center"
        >
          + Neue Kampagne
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <p className="text-slate-400 text-sm">Noch keine Kampagnen erstellt.</p>
          <p className="text-slate-500 text-xs">
            Erstelle eine Kampagne, um UTM-Links zu generieren und Conversions zu verfolgen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className={`glass rounded-xl p-4 flex items-center justify-between gap-4 ${
                c.status === 'archived' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow shrink-0 bg-gradient-to-br from-blue-500 to-purple-500">
                  {PLATFORM_LABELS[c.platform]?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {c.name}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span>{PLATFORM_LABELS[c.platform]}</span>
                    <span>·</span>
                    <span className="font-mono">{c.utm_campaign}</span>
                    {c.start_date && (
                      <>
                        <span>·</span>
                        <span>{c.start_date}{c.end_date ? ` — ${c.end_date}` : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => showStats(c)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors min-h-[44px] px-2"
                >
                  Stats
                </button>
                <button
                  onClick={() => startEdit(c)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] px-2"
                >
                  Bearbeiten
                </button>
                {c.status !== 'archived' && (
                  <button
                    onClick={() => handleArchive(c.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors min-h-[44px] px-2"
                  >
                    Archivieren
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

// --- Reusable components ---

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => (
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
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs text-slate-400 font-medium">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const KpiCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="glass rounded-xl p-4 text-center space-y-1">
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
  </div>
);
