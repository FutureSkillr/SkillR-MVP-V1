import React, { useEffect, useRef, useState } from 'react';
import { TextArea } from './FormFields';
import { lfsUpload, type LfsEnvelope, type UploadProgress } from '../../services/lfsUpload';
import type { VideoInputType } from '../../services/contentPack';

interface VideoSlotInputProps {
  label: string;
  inputType: VideoInputType;
  value: string;
  envelope?: LfsEnvelope | null;
  onTypeChange: (type: VideoInputType) => void;
  onValueChange: (value: string) => void;
  onEnvelopeChange: (envelope: LfsEnvelope | null) => void;
  uploadTopic: string;
  uploadKeyPrefix: string;
}

const TYPE_OPTIONS: { value: VideoInputType; label: string }[] = [
  { value: 'upload', label: 'Video hochladen' },
  { value: 'youtube', label: 'YouTube-Link' },
  { value: 'text', label: 'Text' },
];

const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/;

export const VideoSlotInput: React.FC<VideoSlotInputProps> = ({
  label,
  inputType,
  value,
  envelope,
  onTypeChange,
  onValueChange,
  onEnvelopeChange,
  uploadTopic,
  uploadKeyPrefix,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const xhrAbortRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup: abort upload on unmount
  useEffect(() => {
    return () => {
      xhrAbortRef.current?.();
    };
  }, []);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percent: 0 });

    try {
      const key = `${uploadKeyPrefix}/${Date.now()}-${file.name}`;
      const env = await lfsUpload(file, uploadTopic, key, (p) => setUploadProgress(p));
      onValueChange(file.name);
      onEnvelopeChange(env);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const youtubeValid = !value || YOUTUBE_REGEX.test(value);

  return (
    <div className="space-y-3">
      <label className="text-xs text-slate-400 font-medium">{label}</label>

      {/* Type selector */}
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onTypeChange(opt.value);
              onValueChange('');
              onEnvelopeChange(null);
              setUploadError(null);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              inputType === opt.value
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800/50 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Upload mode */}
      {inputType === 'upload' && (
        <div className="space-y-2">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-blue-500/50 bg-blue-500/5'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileInput}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Hochladen... {uploadProgress?.percent ?? 0}%</p>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress?.percent ?? 0}%` }}
                  />
                </div>
              </div>
            ) : envelope ? (
              <div className="space-y-1">
                <p className="text-sm text-emerald-400 font-medium">{value}</p>
                <p className="text-[10px] text-slate-500">
                  {formatSize(envelope.size)} | {envelope.content_type}
                </p>
                <p className="text-[10px] text-slate-600">
                  Klicke oder ziehe ein neues Video hierher, um zu ersetzen
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Video hierher ziehen oder klicken</p>
                <p className="text-[10px] text-slate-600">MP4, MOV, WebM</p>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-red-400">{uploadError}</p>
          )}
        </div>
      )}

      {/* YouTube mode */}
      {inputType === 'youtube' && (
        <div className="space-y-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          {value && !youtubeValid && (
            <p className="text-[10px] text-amber-400">Bitte eine gueltige YouTube-URL eingeben</p>
          )}
        </div>
      )}

      {/* Text mode */}
      {inputType === 'text' && (
        <TextArea
          label=""
          value={value}
          onChange={onValueChange}
          placeholder="Beschreibung oder Referenz..."
          rows={4}
        />
      )}
    </div>
  );
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
