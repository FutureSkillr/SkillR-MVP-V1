import React, { useState } from 'react';
import { Field, TextArea } from './FormFields';
import { VideoSlotInput } from './VideoSlotInput';
import {
  adminCreateSubmission,
  adminUpdateSubmission,
  adminSubmitSubmission,
  type VideosetSubmission,
  type VideoInputType,
  type LfsEnvelope,
} from '../../services/contentPack';

interface SubmissionFormProps {
  packId: string;
  submission?: VideosetSubmission;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  in_review: 'In Pruefung',
  completed: 'Erstellt',
  rejected: 'Abgelehnt',
};

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  packId,
  submission,
  onClose,
  onSaved,
}) => {
  const isNew = !submission;
  const [title, setTitle] = useState(submission?.title ?? '');
  const [videoAType, setVideoAType] = useState<VideoInputType>(submission?.videoAType ?? '');
  const [videoAValue, setVideoAValue] = useState(submission?.videoAValue ?? '');
  const [videoAEnvelope, setVideoAEnvelope] = useState<LfsEnvelope | null>(
    (submission?.videoAEnvelope as LfsEnvelope) ?? null,
  );
  const [videoBType, setVideoBType] = useState<VideoInputType>(submission?.videoBType ?? '');
  const [videoBValue, setVideoBValue] = useState(submission?.videoBValue ?? '');
  const [videoBEnvelope, setVideoBEnvelope] = useState<LfsEnvelope | null>(
    (submission?.videoBEnvelope as LfsEnvelope) ?? null,
  );
  const [didacticsNotes, setDidacticsNotes] = useState(submission?.didacticsNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(submission?.id ?? null);

  const status = submission?.status ?? 'draft';
  const isDraft = status === 'draft';
  const canSubmit = isDraft && !!title && !!videoAType && !!videoAValue;

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload: Partial<VideosetSubmission> = {
      title,
      videoAType,
      videoAValue,
      videoAEnvelope,
      videoBType,
      videoBValue,
      videoBEnvelope,
      didacticsNotes,
    };

    try {
      if (isNew && !savedId) {
        const created = await adminCreateSubmission(packId, payload);
        if (created) {
          setSavedId(created.id);
          onSaved();
        } else {
          setError('Fehler beim Erstellen.');
        }
      } else {
        const id = savedId || submission!.id;
        const ok = await adminUpdateSubmission(packId, id, payload);
        if (ok) {
          onSaved();
        } else {
          setError('Fehler beim Speichern.');
        }
      }
    } catch {
      setError('Fehler beim Speichern.');
    }
    setSaving(false);
  }

  async function handleSubmit() {
    const id = savedId || submission?.id;
    if (!id) return;

    setSubmitting(true);
    setError(null);

    // Save first, then submit
    await handleSave();

    const ok = await adminSubmitSubmission(packId, id);
    if (ok) {
      onSaved();
      onClose();
    } else {
      setError('Fehler beim Einreichen. Ist der Entwurf gespeichert?');
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">
            {isNew ? 'Neue Lernreise einreichen' : `Einreichung bearbeiten: ${title}`}
          </h3>
          {!isNew && (
            <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_BADGES[status] ?? STATUS_BADGES.draft}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
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

      {submission?.rejectionReason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm">
          <p className="text-red-400 font-medium text-xs">Ablehnungsgrund:</p>
          <p className="text-red-300 mt-1">{submission.rejectionReason}</p>
        </div>
      )}

      <Field
        label="Arbeitstitel"
        value={title}
        onChange={setTitle}
        placeholder="z.B. VUCA-Reise: Nachhaltigkeit in der Logistik"
        disabled={!isDraft}
      />

      <VideoSlotInput
        label="Video A: Video in Scope (Pflicht)"
        inputType={videoAType}
        value={videoAValue}
        envelope={videoAEnvelope}
        onTypeChange={(t) => { if (isDraft) setVideoAType(t); }}
        onValueChange={(v) => { if (isDraft) setVideoAValue(v); }}
        onEnvelopeChange={(e) => { if (isDraft) setVideoAEnvelope(e); }}
        uploadTopic="skillr-video-submissions"
        uploadKeyPrefix={`pack/${packId}/video-a`}
      />

      <VideoSlotInput
        label="Video B: Runbook (Optional)"
        inputType={videoBType}
        value={videoBValue}
        envelope={videoBEnvelope}
        onTypeChange={(t) => { if (isDraft) setVideoBType(t); }}
        onValueChange={(v) => { if (isDraft) setVideoBValue(v); }}
        onEnvelopeChange={(e) => { if (isDraft) setVideoBEnvelope(e); }}
        uploadTopic="skillr-video-submissions"
        uploadKeyPrefix={`pack/${packId}/video-b`}
      />

      <TextArea
        label="Didaktische Hinweise"
        value={didacticsNotes}
        onChange={(v) => { if (isDraft) setDidacticsNotes(v); }}
        placeholder="Hinweise fuer die didaktische Aufbereitung..."
        rows={4}
      />

      {isDraft && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="flex-1 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 text-white font-medium py-3 rounded-xl border border-white/10 transition-all min-h-[48px]"
          >
            {saving ? 'Speichern...' : 'Entwurf speichern'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg transition-all min-h-[48px]"
          >
            {submitting ? 'Einreichen...' : 'Einreichen'}
          </button>
        </div>
      )}
    </div>
  );
};

export { STATUS_BADGES, STATUS_LABELS };
