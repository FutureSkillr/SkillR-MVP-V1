import React, { useEffect, useState } from 'react';
import { GeoSearchModal } from './GeoSearchModal';
import { Field, TextArea, NumberField } from './FormFields';
import { SubmissionForm, STATUS_BADGES, STATUS_LABELS } from './SubmissionForm';
import {
  adminListPacks,
  adminCreatePack,
  adminUpdatePack,
  adminDeletePack,
  adminListPackLernreisen,
  adminCreateLernreise,
  adminUpdateLernreise,
  adminDeleteLernreise,
  adminReorderLernreisen,
  adminListSubmissions,
  type AdminContentPack,
  type AdminLernreise,
  type VideosetSubmission,
} from '../../services/contentPack';

const JOURNEY_TYPES = ['vuca', 'entrepreneur', 'self-learning'] as const;

const DIMENSION_OPTIONS = [
  'complexity', 'uncertainty', 'curiosity', 'self-direction', 'reflection',
  'creativity', 'initiative', 'adaptability', 'resilience', 'volatility', 'ambiguity',
] as const;

const JOURNEY_TYPE_LABELS: Record<string, string> = {
  vuca: 'VUCA',
  entrepreneur: 'Entrepreneur',
  'self-learning': 'Self-Learning',
};

const JOURNEY_TYPE_COLORS: Record<string, string> = {
  vuca: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  entrepreneur: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'self-learning': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function emptyPack(): Partial<AdminContentPack> {
  return { id: '', name: '', description: '', sponsor: '', defaultEnabled: false };
}

function emptyLernreise(packId: string): Partial<AdminLernreise> {
  return {
    id: '', title: '', subtitle: '', description: '', icon: '',
    journeyType: 'vuca', location: '', lat: 0, lng: 0,
    setting: '', characterName: '', characterDesc: '',
    dimensions: [], sortOrder: 0, packId,
  };
}

export const ContentPackEditor: React.FC = () => {
  // Level 1: Pack list
  const [packs, setPacks] = useState<AdminContentPack[]>([]);
  const [loading, setLoading] = useState(true);

  // Level 2: Pack detail
  const [editingPack, setEditingPack] = useState<Partial<AdminContentPack> | null>(null);
  const [isNewPack, setIsNewPack] = useState(false);
  const [packLernreisen, setPackLernreisen] = useState<AdminLernreise[]>([]);

  // Level 3: Lernreise editor
  const [editingLr, setEditingLr] = useState<Partial<AdminLernreise> | null>(null);
  const [isNewLr, setIsNewLr] = useState(false);

  // Submissions (FR-131)
  const [submissions, setSubmissions] = useState<VideosetSubmission[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<VideosetSubmission | undefined>(undefined);

  // Geo search modal
  const [geoModalOpen, setGeoModalOpen] = useState(false);

  // Shared state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadPacks() {
    setLoading(true);
    const result = await adminListPacks();
    setPacks(result);
    setLoading(false);
  }

  useEffect(() => { loadPacks(); }, []);

  async function loadLernreisen(packId: string) {
    const result = await adminListPackLernreisen(packId);
    setPackLernreisen(result);
  }

  async function loadSubmissions(packId: string) {
    const result = await adminListSubmissions(packId);
    setSubmissions(result);
  }

  // --- Pack CRUD ---

  function startCreatePack() {
    setEditingPack(emptyPack());
    setIsNewPack(true);
    setPackLernreisen([]);
    setEditingLr(null);
    setError(null);
    setSuccess(null);
  }

  function startEditPack(pack: AdminContentPack) {
    setEditingPack({ ...pack });
    setIsNewPack(false);
    setEditingLr(null);
    setShowSubmissionForm(false);
    setEditingSubmission(undefined);
    setError(null);
    setSuccess(null);
    loadLernreisen(pack.id);
    loadSubmissions(pack.id);
  }

  async function handleSavePack() {
    if (!editingPack) return;
    setSaving(true);
    setError(null);

    const ok = isNewPack
      ? await adminCreatePack(editingPack)
      : await adminUpdatePack(editingPack.id!, editingPack);

    if (ok) {
      setSuccess(isNewPack ? 'Content Pack erstellt!' : 'Content Pack gespeichert!');
      if (isNewPack) {
        setIsNewPack(false);
        loadLernreisen(editingPack.id!);
      }
      loadPacks();
    } else {
      setError('Fehler beim Speichern des Content Packs.');
    }
    setSaving(false);
  }

  async function handleDeletePack() {
    if (!editingPack?.id) return;
    if (!confirm(`Content Pack "${editingPack.name}" wirklich loeschen? Alle Lernreisen und Brand-Verknuepfungen werden entfernt.`)) return;

    const ok = await adminDeletePack(editingPack.id);
    if (ok) {
      setSuccess('Content Pack geloescht!');
      setEditingPack(null);
      loadPacks();
    } else {
      setError('Fehler beim Loeschen.');
    }
  }

  // --- Lernreise CRUD ---

  function startCreateLr() {
    if (!editingPack?.id) return;
    const lr = emptyLernreise(editingPack.id);
    lr.sortOrder = packLernreisen.length;
    setEditingLr(lr);
    setIsNewLr(true);
    setError(null);
    setSuccess(null);
  }

  function startEditLr(lr: AdminLernreise) {
    setEditingLr({ ...lr });
    setIsNewLr(false);
    setError(null);
    setSuccess(null);
  }

  async function handleSaveLr() {
    if (!editingLr || !editingPack?.id) return;
    setSaving(true);
    setError(null);

    const ok = isNewLr
      ? await adminCreateLernreise(editingPack.id, editingLr)
      : await adminUpdateLernreise(editingPack.id, editingLr.id!, editingLr);

    if (ok) {
      setSuccess(isNewLr ? 'Lernreise erstellt!' : 'Lernreise gespeichert!');
      setEditingLr(null);
      loadLernreisen(editingPack.id);
      loadPacks();
    } else {
      setError('Fehler beim Speichern der Lernreise.');
    }
    setSaving(false);
  }

  async function handleDeleteLr() {
    if (!editingLr?.id || !editingPack?.id) return;
    if (!confirm(`Lernreise "${editingLr.title}" wirklich loeschen?`)) return;

    const ok = await adminDeleteLernreise(editingPack.id, editingLr.id);
    if (ok) {
      setSuccess('Lernreise geloescht!');
      setEditingLr(null);
      loadLernreisen(editingPack.id);
      loadPacks();
    } else {
      setError('Fehler beim Loeschen.');
    }
  }

  async function handleMoveLr(index: number, direction: -1 | 1) {
    if (!editingPack?.id) return;
    const newList = [...packLernreisen];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newList.length) return;

    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const orderedIds = newList.map((lr) => lr.id);

    setPackLernreisen(newList);
    await adminReorderLernreisen(editingPack.id, orderedIds);
  }

  // --- Level 3: Lernreise editor ---
  if (editingLr) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {isNewLr ? 'Neue Lernreise' : `Lernreise bearbeiten: ${editingLr.title}`}
          </h3>
          <button
            onClick={() => setEditingLr(null)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-slate-300">Grunddaten</legend>
              <Field
                label="ID"
                value={editingLr.id || ''}
                onChange={(v) => setEditingLr({ ...editingLr, id: v })}
                placeholder="lr-meine-reise"
                disabled={!isNewLr}
                hint="Einmalige ID, kann nicht geaendert werden"
              />
              <Field
                label="Titel"
                value={editingLr.title || ''}
                onChange={(v) => setEditingLr({ ...editingLr, title: v })}
                placeholder="Meine Lernreise"
              />
              <Field
                label="Untertitel"
                value={editingLr.subtitle || ''}
                onChange={(v) => setEditingLr({ ...editingLr, subtitle: v })}
                placeholder="Kurze Beschreibung"
              />
              <TextArea
                label="Beschreibung"
                value={editingLr.description || ''}
                onChange={(v) => setEditingLr({ ...editingLr, description: v })}
                placeholder="Ausfuehrliche Beschreibung der Lernreise..."
              />
              <Field
                label="Icon"
                value={editingLr.icon || ''}
                onChange={(v) => setEditingLr({ ...editingLr, icon: v })}
                placeholder="z.B. ein Emoji"
                hint="Emoji oder Text-Icon"
              />
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Journey-Typ</label>
                <select
                  value={editingLr.journeyType || 'vuca'}
                  onChange={(e) => setEditingLr({ ...editingLr, journeyType: e.target.value })}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  {JOURNEY_TYPES.map((jt) => (
                    <option key={jt} value={jt}>{JOURNEY_TYPE_LABELS[jt]}</option>
                  ))}
                </select>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-slate-300">Ort</legend>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Field
                    label="Location"
                    value={editingLr.location || ''}
                    onChange={(v) => setEditingLr({ ...editingLr, location: v })}
                    placeholder="Berlin"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setGeoModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium min-h-[38px] shrink-0"
                >
                  Suchen
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Breitengrad (lat)"
                  value={editingLr.lat ?? 0}
                  onChange={(v) => setEditingLr({ ...editingLr, lat: v })}
                  min={-90}
                  max={90}
                  step={0.01}
                />
                <NumberField
                  label="Laengengrad (lng)"
                  value={editingLr.lng ?? 0}
                  onChange={(v) => setEditingLr({ ...editingLr, lng: v })}
                  min={-180}
                  max={180}
                  step={0.01}
                />
              </div>
              <GeoSearchModal
                open={geoModalOpen}
                onClose={() => setGeoModalOpen(false)}
                onSelect={(location, lat, lng) => {
                  setEditingLr({ ...editingLr, location, lat, lng });
                }}
                initialQuery={editingLr.location || ''}
              />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-slate-300">Setting & Charakter</legend>
              <TextArea
                label="Setting"
                value={editingLr.setting || ''}
                onChange={(v) => setEditingLr({ ...editingLr, setting: v })}
                placeholder="Beschreibung des Schauplatzes..."
              />
              <Field
                label="Charakter-Name"
                value={editingLr.characterName || ''}
                onChange={(v) => setEditingLr({ ...editingLr, characterName: v })}
                placeholder="Dr. Stella"
              />
              <TextArea
                label="Charakter-Beschreibung"
                value={editingLr.characterDesc || ''}
                onChange={(v) => setEditingLr({ ...editingLr, characterDesc: v })}
                placeholder="Eine kurze Beschreibung des Charakters..."
              />
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-slate-300">Dimensionen</legend>
              <p className="text-[10px] text-slate-500">
                Waehle die VUCA-Dimensionen, die diese Lernreise abdeckt.
              </p>
              <div className="flex flex-wrap gap-2">
                {DIMENSION_OPTIONS.map((dim) => {
                  const selected = editingLr.dimensions?.includes(dim) ?? false;
                  return (
                    <button
                      key={dim}
                      onClick={() => {
                        const dims = editingLr.dimensions || [];
                        setEditingLr({
                          ...editingLr,
                          dimensions: selected ? dims.filter((d) => d !== dim) : [...dims, dim],
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        selected
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-slate-800/50 border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {dim}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* Live preview */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-300">Vorschau</h4>
            <LernreisePreviewCard lr={editingLr} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveLr}
            disabled={saving || !editingLr.id || !editingLr.title || !editingLr.journeyType}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all min-h-[48px]"
          >
            {saving ? 'Speichern...' : isNewLr ? 'Lernreise erstellen' : 'Aenderungen speichern'}
          </button>
          {!isNewLr && (
            <button
              onClick={handleDeleteLr}
              className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors min-h-[48px]"
            >
              Loeschen
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Submission form (FR-131) ---
  if (showSubmissionForm && editingPack?.id) {
    return (
      <SubmissionForm
        packId={editingPack.id}
        submission={editingSubmission}
        onClose={() => { setShowSubmissionForm(false); setEditingSubmission(undefined); }}
        onSaved={() => loadSubmissions(editingPack.id!)}
      />
    );
  }

  // --- Level 2: Pack detail ---
  if (editingPack) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {isNewPack ? 'Neues Content Pack' : `Content Pack bearbeiten: ${editingPack.name}`}
          </h3>
          <button
            onClick={() => { setEditingPack(null); setSuccess(null); }}
            className="text-xs text-slate-400 hover:text-white transition-colors min-h-[44px] px-3"
          >
            Zurueck zur Liste
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Pack metadata form */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-slate-300">Pack-Metadaten</legend>
          <Field
            label="ID"
            value={editingPack.id || ''}
            onChange={(v) => setEditingPack({ ...editingPack, id: v })}
            placeholder="006"
            disabled={!isNewPack}
            hint="Einmalige Pack-ID (z.B. 006)"
          />
          <Field
            label="Name"
            value={editingPack.name || ''}
            onChange={(v) => setEditingPack({ ...editingPack, name: v })}
            placeholder="Mein Content Pack"
          />
          <Field
            label="Beschreibung"
            value={editingPack.description || ''}
            onChange={(v) => setEditingPack({ ...editingPack, description: v })}
            placeholder="Beschreibung des Packs..."
          />
          <Field
            label="Sponsor"
            value={editingPack.sponsor || ''}
            onChange={(v) => setEditingPack({ ...editingPack, sponsor: v })}
            placeholder="(optional)"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">Standard aktiv</label>
            <button
              onClick={() => setEditingPack({ ...editingPack, defaultEnabled: !editingPack.defaultEnabled })}
              className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${
                editingPack.defaultEnabled
                  ? 'bg-emerald-500/30 border border-emerald-500/50'
                  : 'bg-slate-700/50 border border-white/10'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all ${
                  editingPack.defaultEnabled
                    ? 'left-6 bg-emerald-400'
                    : 'left-1 bg-slate-500'
                }`}
              />
            </button>
            <span className="text-[10px] text-slate-500">
              {editingPack.defaultEnabled ? 'Fuer alle Nutzer sichtbar' : 'Nur fuer verknuepfte Brands sichtbar'}
            </span>
          </div>
        </fieldset>

        {/* Save pack */}
        <div className="flex gap-3">
          <button
            onClick={handleSavePack}
            disabled={saving || !editingPack.id || !editingPack.name}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all min-h-[48px]"
          >
            {saving ? 'Speichern...' : isNewPack ? 'Pack erstellen' : 'Pack speichern'}
          </button>
          {!isNewPack && (
            <button
              onClick={handleDeletePack}
              className="px-6 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors min-h-[48px]"
            >
              Pack loeschen
            </button>
          )}
        </div>

        {/* Lernreisen section (only for saved packs) */}
        {!isNewPack && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-slate-300">
              Lernreisen ({packLernreisen.length})
            </legend>

            {packLernreisen.length === 0 ? (
              <p className="text-xs text-slate-500">
                Dieses Pack hat noch keine Lernreisen.
              </p>
            ) : (
              <div className="space-y-2">
                {packLernreisen.map((lr, i) => (
                  <div
                    key={lr.id}
                    className="glass rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0">{lr.icon || '?'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{lr.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${JOURNEY_TYPE_COLORS[lr.journeyType] || 'bg-slate-700/50 text-slate-400'}`}>
                            {JOURNEY_TYPE_LABELS[lr.journeyType] || lr.journeyType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {lr.subtitle} {lr.location && `| ${lr.location}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveLr(i, -1)}
                        disabled={i === 0}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-30 min-h-[36px] px-2 transition-colors"
                        title="Nach oben"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => handleMoveLr(i, 1)}
                        disabled={i === packLernreisen.length - 1}
                        className="text-xs text-slate-400 hover:text-white disabled:opacity-30 min-h-[36px] px-2 transition-colors"
                        title="Nach unten"
                      >
                        &#9660;
                      </button>
                      <button
                        onClick={() => startEditLr(lr)}
                        className="text-xs text-blue-400 hover:text-blue-300 min-h-[36px] px-2 transition-colors"
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={startCreateLr}
              className="text-xs px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium min-h-[44px] flex items-center"
            >
              + Lernreise hinzufuegen
            </button>
          </fieldset>
        )}

        {/* Submissions section (FR-131, only for saved packs) */}
        {!isNewPack && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-slate-300">
              Einreichungen ({submissions.length})
            </legend>

            {submissions.length === 0 ? (
              <p className="text-xs text-slate-500">
                Noch keine Video-Einreichungen fuer dieses Pack.
              </p>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="glass rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{sub.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_BADGES[sub.status] ?? STATUS_BADGES.draft}`}>
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sub.videoAType && `Video A: ${sub.videoAType}`}
                        {sub.videoBType && ` | Video B: ${sub.videoBType}`}
                        {sub.submittedBy && ` | von ${sub.submittedBy}`}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSubmission(sub);
                        setShowSubmissionForm(true);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 min-h-[36px] px-2 transition-colors shrink-0"
                    >
                      Bearbeiten
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setEditingSubmission(undefined);
                setShowSubmissionForm(true);
              }}
              className="text-xs px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium min-h-[44px] flex items-center"
            >
              + Neue Lernreise einreichen
            </button>
          </fieldset>
        )}
      </div>
    );
  }

  // --- Level 1: Pack list ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Content Packs</h3>
          <p className="text-xs text-slate-500">
            Verwalte Lernreise-Pakete und deren Inhalte ({packs.length} Packs)
          </p>
        </div>
        <button
          onClick={startCreatePack}
          className="text-xs px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium min-h-[44px] flex items-center"
        >
          + Neues Content Pack
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Laden...</div>
      ) : packs.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <p className="text-slate-400 text-sm">Noch keine Content Packs vorhanden.</p>
          <p className="text-slate-500 text-xs">
            Erstelle ein Content Pack, um Lernreisen zu buendeln.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((p) => (
            <div
              key={p.id}
              className="glass rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm shadow shrink-0">
                  {p.id}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-2">
                    {p.name}
                    {p.defaultEnabled && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-normal">
                        Standard
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {p.lernreisenCount} Lernreise{p.lernreisenCount !== 1 ? 'n' : ''}
                    {p.sponsor && ` | Sponsor: ${p.sponsor}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEditPack(p)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] px-2"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Field, TextArea, NumberField imported from ./FormFields

const LernreisePreviewCard: React.FC<{ lr: Partial<AdminLernreise> }> = ({ lr }) => (
  <div className="glass rounded-xl p-4 space-y-3">
    <div className="flex items-start gap-3">
      <span className="text-3xl">{lr.icon || '?'}</span>
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-sm">{lr.title || 'Titel'}</h4>
        <p className="text-xs text-slate-400">{lr.subtitle || 'Untertitel'}</p>
      </div>
    </div>

    {lr.journeyType && (
      <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${JOURNEY_TYPE_COLORS[lr.journeyType] || 'bg-slate-700/50 text-slate-400'}`}>
        {JOURNEY_TYPE_LABELS[lr.journeyType] || lr.journeyType}
      </span>
    )}

    {lr.location && (
      <p className="text-[10px] text-slate-500">
        {lr.location}
        {(lr.lat || lr.lng) && ` (${lr.lat?.toFixed(2)}, ${lr.lng?.toFixed(2)})`}
      </p>
    )}

    {lr.description && (
      <p className="text-xs text-slate-400 line-clamp-3">{lr.description}</p>
    )}

    {lr.characterName && (
      <div className="border-t border-white/5 pt-2">
        <p className="text-[10px] text-slate-500">
          <span className="text-slate-400 font-medium">{lr.characterName}</span>
          {lr.characterDesc && ` — ${lr.characterDesc.slice(0, 80)}...`}
        </p>
      </div>
    )}

    {lr.dimensions && lr.dimensions.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {lr.dimensions.map((d) => (
          <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
            {d}
          </span>
        ))}
      </div>
    )}
  </div>
);
