import React, { useState, useEffect, useCallback } from 'react';
import type { PodData } from '../../types/pod';
import { getPodData } from '../../services/pod';

interface PodDataViewerModalProps {
  open: boolean;
  onClose: () => void;
}

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <span className="text-white text-sm font-medium">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-3 border-t border-slate-700/50">
          {children}
        </div>
      )}
    </div>
  );
};

const ResourceBlock: React.FC<{ label: string; content: string }> = ({ label, content }) => (
  <div>
    <p className="text-slate-500 text-xs mb-1">{label}</p>
    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
      {content}
    </pre>
  </div>
);

export const PodDataViewerModal: React.FC<PodDataViewerModalProps> = ({ open, onClose }) => {
  const [data, setData] = useState<PodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPodData();
      setData(result);
    } catch {
      setError('Pod-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  if (!open) return null;

  const hasProfile = data?.profile && Object.keys(data.profile).length > 0;
  const hasJourney = data?.journey && Object.keys(data.journey).length > 0;
  const hasReflections = data?.reflections && data.reflections.length > 0;
  const hasAnyData = hasProfile || hasJourney || hasReflections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h2 className="text-white font-semibold">Pod-Daten</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto space-y-3">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Daten werden geladen...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && !hasAnyData && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Noch keine Daten im Pod.</p>
              <p className="text-slate-600 text-xs mt-1">Synchronisiere zuerst deine Daten.</p>
            </div>
          )}

          {!loading && !error && hasAnyData && (
            <>
              {hasProfile && (
                <CollapsibleSection title="Profil" defaultOpen>
                  {Object.entries(data!.profile!).map(([key, value]) => (
                    <ResourceBlock key={key} label={key} content={value} />
                  ))}
                </CollapsibleSection>
              )}

              {hasJourney && (
                <CollapsibleSection title="Reise">
                  {Object.entries(data!.journey!).map(([key, value]) => (
                    <ResourceBlock key={key} label={key} content={value} />
                  ))}
                </CollapsibleSection>
              )}

              {hasReflections && (
                <CollapsibleSection title="Reflexionen">
                  {data!.reflections!.map((entry, i) => (
                    <div key={i} className="space-y-2">
                      {Object.entries(entry).map(([key, value]) => (
                        <ResourceBlock key={key} label={`${key} (#${i + 1})`} content={value} />
                      ))}
                    </div>
                  ))}
                </CollapsibleSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
