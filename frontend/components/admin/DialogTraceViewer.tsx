import React, { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../services/auth';
import type { PromptLogEntry, PromptLogStats, PromptLogSession } from '../../types/promptlog';

interface SessionGroup {
  sessionId: string;
  sessionType: string;
  logs: PromptLogEntry[];
  firstTimestamp: number;
  lastTimestamp: number;
  totalLatency: number;
}

export const DialogTraceViewer: React.FC = () => {
  const [logs, setLogs] = useState<PromptLogEntry[]>([]);
  const [stats, setStats] = useState<PromptLogStats | null>(null);
  const [sessions, setSessions] = useState<PromptLogSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSessionType, setFilterSessionType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMethod) params.set('method', filterMethod);
      if (filterStatus) params.set('status', filterStatus);

      const qs = params.toString();
      const headers = getAuthHeaders();

      const [logsRes, statsRes, sessionsRes] = await Promise.all([
        fetch(`/api/prompt-logs${qs ? `?${qs}` : ''}`, { headers }),
        fetch('/api/prompt-logs/stats', { headers }),
        fetch('/api/sessions', { headers }),
      ]);

      const logsData: PromptLogEntry[] = logsRes.ok ? await logsRes.json() : [];
      const statsData: PromptLogStats = statsRes.ok ? await statsRes.json() : { totalCalls: 0, successCount: 0, errorCount: 0, avgLatencyMs: 0, totalTokenEstimate: 0 };
      const sessionsData: PromptLogSession[] = sessionsRes.ok ? await sessionsRes.json() : [];

      setLogs(Array.isArray(logsData) ? logsData : []);
      setStats(statsData);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (e) {
      console.warn('Failed to load dialog trace data:', e);
    } finally {
      setLoading(false);
    }
  }, [filterMethod, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = useCallback(async () => {
    try {
      const res = await fetch('/api/prompt-logs/export-csv', { headers: getAuthHeaders() });
      if (!res.ok) return;
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dialog-trace-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('CSV export failed:', e);
    }
  }, []);

  // Group logs by session_id
  const sessionGroups: SessionGroup[] = React.useMemo(() => {
    const map = new Map<string, SessionGroup>();
    for (const log of logs) {
      const sid = log.session_id || 'no-session';
      if (!map.has(sid)) {
        map.set(sid, {
          sessionId: sid,
          sessionType: log.session_type || '-',
          logs: [],
          firstTimestamp: log.request_timestamp,
          lastTimestamp: log.request_timestamp,
          totalLatency: 0,
        });
      }
      const group = map.get(sid)!;
      group.logs.push(log);
      if (log.request_timestamp < group.firstTimestamp) group.firstTimestamp = log.request_timestamp;
      if (log.request_timestamp > group.lastTimestamp) group.lastTimestamp = log.request_timestamp;
      group.totalLatency += log.latency_ms || 0;
      if (log.session_type) group.sessionType = log.session_type;
    }
    // Sort logs within each group chronologically (oldest first)
    for (const group of map.values()) {
      group.logs.sort((a, b) => a.request_timestamp - b.request_timestamp);
    }
    // Sort groups by most recent first
    return Array.from(map.values())
      .filter((g) => !filterSessionType || g.sessionType === filterSessionType)
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }, [logs, filterSessionType]);

  // Collect unique session types for filter
  const sessionTypes = React.useMemo(() => {
    const types = new Set<string>();
    for (const log of logs) {
      if (log.session_type) types.add(log.session_type);
    }
    return Array.from(types).sort();
  }, [logs]);

  if (loading) {
    return (
      <div className="text-center text-slate-500 py-16 text-sm">
        Lade Dialog-Daten...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-lg bg-slate-900/50 border border-white/5 text-xs font-mono">
          <span className="text-slate-400">
            Gesamt: <span className="text-white font-semibold">{stats.totalCalls}</span>
          </span>
          <span className="text-green-400">OK: {stats.successCount}</span>
          <span className="text-red-400">Fehler: {stats.errorCount}</span>
          <span className="text-slate-400">
            Avg Latenz: <span className="text-yellow-300">{stats.avgLatencyMs}ms</span>
          </span>
          <span className="text-slate-400">
            Tokens: <span className="text-purple-300">~{stats.totalTokenEstimate.toLocaleString()}</span>
          </span>
          <span className="text-slate-400">
            Sessions: <span className="text-blue-300">{sessionGroups.length}</span>
          </span>
        </div>
      )}

      {/* Filters + Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1.5 border border-white/10"
        >
          <option value="">Alle Methoden</option>
          <option value="chat">chat</option>
          <option value="extractInsights">extractInsights</option>
          <option value="extractStationResult">extractStationResult</option>
          <option value="generateCurriculum">generateCurriculum</option>
          <option value="generateCourse">generateCourse</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1.5 border border-white/10"
        >
          <option value="">Alle Status</option>
          <option value="success">success</option>
          <option value="error">error</option>
        </select>
        <select
          value={filterSessionType}
          onChange={(e) => setFilterSessionType(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1.5 border border-white/10"
        >
          <option value="">Alle Session-Typen</option>
          {sessionTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors border border-blue-500/20"
          >
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors border border-white/10"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Session Groups */}
      {sessionGroups.length === 0 ? (
        <div className="text-center text-slate-500 py-16 text-sm">
          Noch keine Dialog-Daten vorhanden.
        </div>
      ) : (
        <div className="space-y-2">
          {sessionGroups.map((group) => {
            const isExpanded = expandedSession === group.sessionId;
            const errorCount = group.logs.filter((l) => l.status === 'error').length;

            return (
              <div key={group.sessionId} className="rounded-lg border border-white/5 overflow-hidden">
                {/* Session Header */}
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : group.sessionId)}
                  className="w-full text-left px-4 py-3 bg-slate-900/60 hover:bg-slate-900/80 transition-colors flex items-center gap-3"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${errorCount > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="text-xs font-mono text-purple-300 font-medium w-28 flex-shrink-0">
                    {group.sessionType}
                  </span>
                  <span className="text-xs font-mono text-slate-500 w-36 flex-shrink-0">
                    {formatTimestamp(group.firstTimestamp)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex-shrink-0">
                    {group.logs.length} {group.logs.length === 1 ? 'Nachricht' : 'Nachrichten'}
                  </span>
                  <span className="text-xs font-mono text-yellow-300/70 flex-shrink-0">
                    {group.totalLatency}ms
                  </span>
                  {errorCount > 0 && (
                    <span className="text-xs font-mono text-red-400 flex-shrink-0">
                      {errorCount} Fehler
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-600 truncate flex-1 text-right">
                    {group.sessionId.slice(0, 12)}...
                  </span>
                  <span className="text-slate-500 flex-shrink-0 text-xs">
                    {isExpanded ? '\u25B2' : '\u25BC'}
                  </span>
                </button>

                {/* Expanded: Dialog Thread */}
                {isExpanded && (
                  <div className="border-t border-white/5">
                    {group.logs.map((log, idx) => {
                      const isLogExpanded = expandedLog === log.request_id;

                      return (
                        <div key={log.request_id} className="border-b border-white/5 last:border-b-0">
                          {/* Exchange summary row */}
                          <div className="px-4 py-2 bg-slate-950/40">
                            <div className="flex items-start gap-3 text-xs">
                              <span className="text-slate-600 font-mono w-5 flex-shrink-0 text-right pt-0.5">
                                {idx + 1}.
                              </span>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                {/* User message */}
                                <div className="flex items-start gap-2">
                                  <span className="text-blue-400 font-semibold flex-shrink-0 w-10">User:</span>
                                  <span className="text-slate-300 break-words">
                                    {truncate(log.user_message, 200)}
                                  </span>
                                </div>
                                {/* AI response */}
                                <div className="flex items-start gap-2">
                                  <span className="text-emerald-400 font-semibold flex-shrink-0 w-10">AI:</span>
                                  <span className="text-slate-400 break-words">
                                    {truncate(log.raw_response, 200)}
                                  </span>
                                </div>
                              </div>
                              {/* Meta */}
                              <div className="flex-shrink-0 flex items-center gap-2 pt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-yellow-300/60 font-mono">{log.latency_ms}ms</span>
                                <span className="text-slate-600 font-mono">{log.method}</span>
                                {log.retry_count > 0 && (
                                  <span className="text-orange-400 font-mono">R:{log.retry_count}</span>
                                )}
                                <button
                                  onClick={() => setExpandedLog(isLogExpanded ? null : log.request_id)}
                                  className="text-slate-500 hover:text-slate-300 transition-colors px-1"
                                >
                                  {isLogExpanded ? '\u25B2' : '\u2026'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isLogExpanded && (
                            <div className="px-8 py-3 bg-slate-900/30 space-y-3 text-xs">
                              <DetailSection title="System Prompt" content={log.system_prompt} />
                              <DetailSection title="User Message" content={log.user_message} />
                              {log.chat_history && log.chat_history !== '[]' && (
                                <DetailSection title="Chat History" content={formatJson(log.chat_history)} />
                              )}
                              <DetailSection title="Raw Response" content={log.raw_response} />
                              {log.structured_response && (
                                <DetailSection title="Structured Response" content={formatJson(log.structured_response)} />
                              )}
                              {log.error_message && (
                                <DetailSection title="Fehler" content={log.error_message} isError />
                              )}
                              <div className="flex flex-wrap gap-4 text-slate-500 pt-1">
                                <span>Model: {log.model_name}</span>
                                <span>Tokens: ~{log.token_count_estimate}</span>
                                <span>Request-ID: {log.request_id.slice(0, 16)}...</span>
                                <span>Zeit: {formatTimestamp(log.request_timestamp)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Helpers ---

function DetailSection({ title, content, isError }: { title: string; content: string; isError?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (!content) return null;
  const isLong = content.length > 300;

  return (
    <div>
      <div className="text-slate-500 font-semibold mb-1">{title}</div>
      <pre
        className={`whitespace-pre-wrap break-all p-2 rounded text-xs ${
          isError ? 'bg-red-950/50 text-red-300' : 'bg-slate-800/50 text-slate-300'
        } ${!expanded && isLong ? 'max-h-24 overflow-hidden' : ''}`}
      >
        {content}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-400 hover:text-blue-300 mt-1 text-xs"
        >
          {expanded ? 'Weniger anzeigen' : 'Mehr anzeigen...'}
        </button>
      )}
    </div>
  );
}

function formatTimestamp(ts: number): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncate(s: string | undefined | null, max: number): string {
  if (!s) return '-';
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
