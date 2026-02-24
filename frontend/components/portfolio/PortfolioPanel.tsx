import React, { useState, useEffect } from 'react';
import type { PortfolioEntry } from '../../types/portfolio';
import {
  listPortfolioEntries,
  createDemoEntries,
  exportPortfolio,
} from '../../services/portfolio';
import { ShareMenu } from './ShareMenu';

const CATEGORY_BADGE: Record<string, string> = {
  project: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  deliverable: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  example: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const CATEGORY_LABEL: Record<string, string> = {
  project: 'Projekt',
  deliverable: 'Ergebnis',
  example: 'Beispiel',
};

export const PortfolioPanel: React.FC = () => {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await listPortfolioEntries();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDemo() {
    setDemoLoading(true);
    try {
      await createDemoEntries();
      await loadEntries();
    } catch (e) {
      console.error('[PortfolioPanel] createDemo error:', e);
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleExport(format: 'html' | 'zip') {
    setExportLoading(true);
    try {
      const blob = await exportPortfolio(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'zip' ? 'portfolio.zip' : 'portfolio.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[PortfolioPanel] export error:', e);
    } finally {
      setExportLoading(false);
    }
  }

  const userId = entries.length > 0 ? entries[0].userId : '';
  const portfolioUrl = userId && typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/portfolio/page/${userId}`
    : '';

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Portfolio</h2>
        <div className="text-center py-8 text-slate-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Portfolio</h2>
          {entries.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 font-medium">
              {entries.length}
            </span>
          )}
        </div>
        {entries.length > 0 && (
          <ShareMenu portfolioUrl={portfolioUrl} displayName="SkillR Learner" />
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-8 space-y-4">
          <p className="text-4xl">📁</p>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Dein Portfolio sammelt deine Projekte, Ergebnisse und Beispiele aus deiner Lernreise.
            Erstelle Demo-Eintraege, um die Funktion kennenzulernen.
          </p>
          <button
            onClick={handleCreateDemo}
            disabled={demoLoading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2 px-6 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {demoLoading ? 'Erstelle...' : 'Demo-Portfolio erstellen'}
          </button>
        </div>
      )}

      {/* Entry list */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border border-slate-700/50 rounded-xl p-4 space-y-2 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-sm text-slate-200">{entry.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${CATEGORY_BADGE[entry.category] || ''}`}
                  >
                    {CATEGORY_LABEL[entry.category] || entry.category}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      entry.visibility === 'public'
                        ? 'bg-green-500/15 text-green-400 border-green-500/25'
                        : 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                    }`}
                  >
                    {entry.visibility === 'public' ? 'Oeffentlich' : 'Privat'}
                  </span>
                </div>
              </div>
              {entry.description && (
                <p className="text-xs text-slate-400 line-clamp-2">{entry.description}</p>
              )}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Export buttons */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => handleExport('html')}
            disabled={exportLoading}
            className="glass px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Als HTML herunterladen
          </button>
          <button
            onClick={() => handleExport('zip')}
            disabled={exportLoading}
            className="glass px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Als ZIP herunterladen
          </button>
        </div>
      )}
    </div>
  );
};
