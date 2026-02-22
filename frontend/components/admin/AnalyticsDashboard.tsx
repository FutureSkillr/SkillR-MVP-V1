import React, { useState, useEffect, useCallback } from 'react';
import type { AnalyticsOverview, UserEventRow } from '../../types/analytics';
import {
  getAnalyticsOverview,
  getAnalyticsEvents,
  getSessionEvents,
  clearAnalytics,
  exportAnalyticsCSV,
} from '../../services/analytics';

function formatDuration(ms: number): string {
  if (ms === 0) return '-';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const AnalyticsDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<{ id: string; eventCount: number; firstSeen: number }[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionEvents, setSessionEvents] = useState<UserEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, events] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsEvents({ limit: 1000 }),
      ]);
      setOverview(ov);

      // Build session summary from events
      const sessionMap = new Map<string, { count: number; firstSeen: number }>();
      for (const e of events) {
        const existing = sessionMap.get(e.browser_session_id);
        if (!existing) {
          sessionMap.set(e.browser_session_id, { count: 1, firstSeen: e.timestamp });
        } else {
          existing.count++;
          if (e.timestamp < existing.firstSeen) existing.firstSeen = e.timestamp;
        }
      }
      const sessions = Array.from(sessionMap.entries())
        .map(([id, { count, firstSeen }]) => ({ id, eventCount: count, firstSeen }))
        .sort((a, b) => b.firstSeen - a.firstSeen)
        .slice(0, 20);
      setRecentSessions(sessions);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExpandSession = useCallback(async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      setSessionEvents([]);
      return;
    }
    setExpandedSession(sessionId);
    try {
      const events = await getSessionEvents(sessionId);
      setSessionEvents(events);
    } catch {
      setSessionEvents([]);
    }
  }, [expandedSession]);

  const handleExportCSV = useCallback(async () => {
    try {
      const csv = await exportAnalyticsCSV();
      if (!csv) return;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-events.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  }, []);

  const handleClear = useCallback(async () => {
    if (!confirm('Alle Analytics-Daten loeschen?')) return;
    await clearAnalytics();
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Lade Analytics...
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-12 text-slate-400">
        Keine Daten verfuegbar.
      </div>
    );
  }

  const maxFunnelCount = overview.conversionFunnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Events" value={String(overview.totalEvents)} />
        <SummaryCard label="Sessions" value={String(overview.uniqueSessions)} />
        <SummaryCard label="Avg. Onboarding" value={formatDuration(overview.avgOnboardingDurationMs)} />
        <SummaryCard label="Avg. Station" value={formatDuration(overview.avgStationDurationMs)} />
      </div>

      {/* Conversion Funnel */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-3">Conversion Funnel</h3>
        <div className="space-y-2">
          {overview.conversionFunnel.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-36 shrink-0">{step.label}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((step.count / maxFunnelCount) * 100, 2)}%` }}
                >
                  <span className="text-[10px] text-white font-mono">{step.count}</span>
                </div>
              </div>
              {i > 0 && (
                <span className="text-[10px] text-red-400 w-12 text-right">
                  -{step.dropoff_percent}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Journey Popularity */}
      {Object.keys(overview.journeyPopularity).length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Journey Popularity</h3>
          <div className="space-y-2">
            {Object.entries(overview.journeyPopularity).map(([journey, count]) => (
              <div key={journey} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-28 shrink-0">{journey}</span>
                <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.max((count / Math.max(...Object.values(overview.journeyPopularity))) * 100, 5)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Navigation Paths */}
      {overview.topPaths.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Top Navigation Paths</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left py-1">From</th>
                <th className="text-left py-1">To</th>
                <th className="text-right py-1">Count</th>
              </tr>
            </thead>
            <tbody>
              {overview.topPaths.slice(0, 10).map((p, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-1 text-slate-400">{p.from_view}</td>
                  <td className="py-1 text-slate-300">{p.to_view}</td>
                  <td className="py-1 text-right text-slate-400">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-3">Recent Sessions</h3>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500">Keine Sessions vorhanden.</p>
        ) : (
          <div className="space-y-1">
            {recentSessions.map((s) => (
              <div key={s.id}>
                <button
                  onClick={() => handleExpandSession(s.id)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-xs font-mono text-slate-400">
                    {s.id.slice(0, 8)}...
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {s.eventCount} events | {formatTimestamp(s.firstSeen)}
                  </span>
                </button>
                {expandedSession === s.id && sessionEvents.length > 0 && (
                  <div className="ml-4 mt-1 mb-2 border-l border-white/10 pl-3 space-y-1">
                    {sessionEvents.map((e) => {
                      const props = typeof e.properties === 'string' ? JSON.parse(e.properties) : e.properties;
                      return (
                        <div key={e.id} className="flex items-start gap-2 text-[10px]">
                          <span className="text-slate-500 shrink-0">
                            {formatTimestamp(e.timestamp)}
                          </span>
                          <span className="text-blue-400 font-mono shrink-0">
                            {e.event_type}
                          </span>
                          <span className="text-slate-600 truncate">
                            {JSON.stringify(props)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleExportCSV}
          className="text-xs px-4 py-2 rounded-lg glass text-slate-300 hover:text-white transition-colors"
        >
          CSV Export
        </button>
        <button
          onClick={handleClear}
          className="text-xs px-4 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
        >
          Alle loeschen
        </button>
        <button
          onClick={loadData}
          className="text-xs px-4 py-2 rounded-lg glass text-slate-300 hover:text-white transition-colors"
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="glass rounded-xl p-4 text-center">
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-[10px] text-slate-500 mt-1">{label}</p>
  </div>
);
