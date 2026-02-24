import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchInfraStatus } from '../../services/infra';
import type { InfraResponse, InfraComponentStatus } from '../../types/infra';

const REFRESH_INTERVAL = 15_000;

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
  unavailable: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]',
  not_configured: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
};

const STATUS_LABELS: Record<string, string> = {
  ok: 'Verbunden',
  unavailable: 'Nicht erreichbar',
  not_configured: 'Nicht konfiguriert',
};

const API_LABELS: Record<string, string> = {
  firebase_auth: 'Firebase Auth',
  vertex_ai: 'Vertex AI',
  solid_pod: 'Solid Pod',
  honeycomb: 'Honeycomb',
  memory_service: 'Memory Service',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.unavailable}`} />
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function ComponentCard({ label, comp }: { label: string; comp: InfraComponentStatus }) {
  return (
    <div className="glass rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <StatusDot status={comp.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{STATUS_LABELS[comp.status] || comp.status}</span>
        {comp.latencyMs !== undefined && (
          <span className="text-slate-500">{comp.latencyMs}ms</span>
        )}
      </div>
      {comp.note && (
        <p className="text-[11px] text-slate-500 italic">{comp.note}</p>
      )}
    </div>
  );
}

export const InfraDashboard: React.FC = () => {
  const [data, setData] = useState<InfraResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchInfraStatus();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(load, REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass rounded-lg p-6 text-center">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <button onClick={load} className="text-xs text-purple-400 hover:text-purple-300 underline">
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data) return null;

  const apiEntries = Object.entries(data.apis);
  const configEntries = Object.entries(data.configPresence);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <StatusDot status={data.status === 'ok' ? 'ok' : 'unavailable'} />
          <span className="text-sm font-semibold text-slate-200">
            {data.status === 'ok' ? 'Alle Systeme operativ' : 'Eingeschraenkter Betrieb'}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto">
          <span>v{data.version}</span>
          <span>Uptime {formatUptime(data.uptimeSeconds)}</span>
          <span>{data.runtime.goroutines} Goroutines</span>
          <span>{data.runtime.heapMB} MB Heap</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium"
        >
          Aktualisieren
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="accent-purple-500"
          />
          Auto-Refresh (15s)
        </label>
        {error && <span className="text-xs text-amber-400 ml-auto">{error}</span>}
      </div>

      {/* Data Infrastructure */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Daten-Infrastruktur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ComponentCard label="PostgreSQL" comp={data.postgres} />
          <ComponentCard label="Redis" comp={data.redis} />
        </div>
      </section>

      {/* Event Streaming */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Event Streaming
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="glass rounded-lg p-4 opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Kafka</span>
              <StatusDot status={data.kafka.status} />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data.kafka.note || STATUS_LABELS[data.kafka.status]}
            </p>
          </div>
        </div>
      </section>

      {/* API Services */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          API-Dienste
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {apiEntries.map(([key, comp]) => (
            <ComponentCard key={key} label={API_LABELS[key] || key} comp={comp} />
          ))}
        </div>
      </section>

      {/* Config Presence */}
      <section>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Konfiguration
        </h3>
        <div className="glass rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {configEntries.map(([key, present]) => (
              <div key={key} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-400 font-mono">{key}</span>
                <span className={present ? 'text-emerald-400' : 'text-red-400'}>
                  {present ? '\u2713' : '\u2717'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
