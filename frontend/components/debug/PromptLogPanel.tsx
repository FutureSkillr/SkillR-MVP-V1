import React, { useState, useEffect, useCallback } from 'react';
import { getPromptLogs, getStats, getSessions, clearAll, exportCSV } from '../../services/db';
import type { PromptLogEntry, PromptLogStats, PromptLogSession } from '../../types/promptlog';

interface PromptLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptLogPanel: React.FC<PromptLogPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<PromptLogEntry[]>([]);
  const [stats, setStats] = useState<PromptLogStats>({ totalCalls: 0, successCount: 0, errorCount: 0, avgLatencyMs: 0, totalTokenEstimate: 0 });
  const [sessions, setSessions] = useState<PromptLogSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSession, setFilterSession] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      const filters: { method?: string; status?: string; sessionId?: string } = {};
      if (filterMethod) filters.method = filterMethod;
      if (filterStatus) filters.status = filterStatus;
      if (filterSession) filters.sessionId = filterSession;

      const [logData, statsData, sessionData] = await Promise.all([
        getPromptLogs(filters),
        getStats(),
        getSessions(),
      ]);
      setLogs(logData);
      setStats(statsData);
      setSessions(sessionData);
    } catch (e) {
      console.warn('Failed to load prompt logs:', e);
    }
  }, [filterMethod, filterStatus, filterSession]);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [isOpen, refresh]);

  const handleExport = useCallback(async () => {
    const csv = await exportCSV();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(async () => {
    await clearAll();
    refresh();
  }, [refresh]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white font-mono">Prompt Log</h2>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 transition-colors">
            Export CSV
          </button>
          <button onClick={handleClear} className="text-xs px-3 py-1.5 rounded-lg bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-colors">
            Clear All
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-white/5 text-xs font-mono">
        <span className="text-slate-400">Total: <span className="text-white">{stats.totalCalls}</span></span>
        <span className="text-green-400">OK: {stats.successCount}</span>
        <span className="text-red-400">Err: {stats.errorCount}</span>
        <span className="text-slate-400">Avg Latency: <span className="text-yellow-300">{stats.avgLatencyMs}ms</span></span>
        <span className="text-slate-400">Tokens: <span className="text-purple-300">~{stats.totalTokenEstimate.toLocaleString()}</span></span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1 border border-white/10"
        >
          <option value="">All Methods</option>
          <option value="chat">chat</option>
          <option value="extractInsights">extractInsights</option>
          <option value="extractStationResult">extractStationResult</option>
          <option value="generateCurriculum">generateCurriculum</option>
          <option value="generateCourse">generateCourse</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1 border border-white/10"
        >
          <option value="">All Status</option>
          <option value="success">success</option>
          <option value="error">error</option>
        </select>
        <select
          value={filterSession}
          onChange={(e) => setFilterSession(e.target.value)}
          className="bg-slate-800 text-xs text-slate-300 rounded px-2 py-1 border border-white/10"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {s.session_type} ({s.session_id.slice(0, 8)})
            </option>
          ))}
        </select>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-white ml-auto">Refresh</button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {logs.length === 0 ? (
          <div className="text-center text-slate-500 py-16 text-sm">No prompt logs yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.request_id}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expandedId === log.request_id ? null : log.request_id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-4 text-xs font-mono"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-slate-400 w-20 flex-shrink-0">{log.method}</span>
                  <span className="text-slate-500 w-28 flex-shrink-0">{log.session_type}</span>
                  <span className="text-yellow-300 w-16 flex-shrink-0 text-right">{log.latency_ms}ms</span>
                  <span className="text-purple-300 w-16 flex-shrink-0 text-right">~{log.token_count_estimate}</span>
                  {log.retry_count > 0 && (
                    <span className="text-orange-400 w-12 flex-shrink-0">R:{log.retry_count}</span>
                  )}
                  <span className="text-slate-600 truncate flex-1">
                    {log.user_message.slice(0, 80)}
                  </span>
                  <span className="text-slate-600 flex-shrink-0">
                    {new Date(log.request_timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-500 flex-shrink-0">{expandedId === log.request_id ? '▲' : '▼'}</span>
                </button>

                {/* Expanded Detail */}
                {expandedId === log.request_id && (
                  <div className="px-6 py-4 bg-slate-900/50 space-y-3 text-xs">
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
                      <DetailSection title="Error" content={log.error_message} isError />
                    )}
                    <div className="flex gap-4 text-slate-500 pt-1">
                      <span>Model: {log.model_name}</span>
                      <span>Request ID: {log.request_id.slice(0, 12)}...</span>
                      <span>Session: {log.session_id.slice(0, 12)}...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function DetailSection({ title, content, isError }: { title: string; content: string; isError?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 300;

  return (
    <div>
      <div className="text-slate-500 font-semibold mb-1">{title}</div>
      <pre className={`whitespace-pre-wrap break-all p-2 rounded ${isError ? 'bg-red-950/50 text-red-300' : 'bg-slate-800/50 text-slate-300'} ${!expanded && isLong ? 'max-h-24 overflow-hidden' : ''}`}>
        {content}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-400 hover:text-blue-300 mt-1"
        >
          {expanded ? 'Show less' : 'Show more...'}
        </button>
      )}
    </div>
  );
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
